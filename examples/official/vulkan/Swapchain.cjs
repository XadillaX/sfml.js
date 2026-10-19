'use strict';

/* eslint no-bitwise: "off" */

const { vk, check, enumerate, Scope } = require('./Common.cjs');
const Resources = require('./Resources.cjs');
const createPipeline = require('./Pipeline.cjs');
const { uniforms } = require('./Scene.cjs');

const forever = 0xffffffffffffffffn;

/** Own all size-dependent render targets and their presentation lifetime. */
class Swapchain {
  /**
   * Keep scene resources separate from swapchain recreation.
   * @param {Context} context Window and device owner.
   * @param {object} scene Uploaded geometry, texture and SPIR-V.
   */
  constructor(context, scene) {
    this.context = context;
    this.scene = scene;
    this.scope = new Scope();
    this.outOfDate = true;
    this.currentFrame = 0;
  }

  /** Rebuild after submissions and presentations using old images finish. */
  recreate() {
    const size = this.context.window.getSize();
    if (!size.x || !size.y) return false;
    this.context.waitIdle();
    this.scope.dispose();
    this.scope = new Scope();
    this.resources = new Resources(this.context, this.scope);
    if (!this.createSwapchain(size)) return false;
    this.depthFormat = this.chooseDepthFormat();
    this.pipeline = createPipeline(this.context, this.scope,
      this.format, this.depthFormat, this.extent, this.scene.shaders);
    this.createTargets();
    this.createDescriptors();
    this.createCommands();
    this.frames = Array.from({ length: 2 }, () => ({
      available: this.createSemaphore(),
      fence: this.createFence(),
    }));
    this.currentFrame = 0;
    this.outOfDate = false;
    return true;
  }

  /**
   * Select a supported surface format, extent and present mode.
   * @param {sf.Vector2u} size Current SFML client size.
   * @return {boolean} False when a minimized surface has no drawable extent.
   */
  createSwapchain(size) {
    const {
      gpu, surface, device, graphicsFamily, presentFamily,
    } = this.context;
    const capabilities = new vk.VkSurfaceCapabilitiesKHR();
    check(vk.vkGetPhysicalDeviceSurfaceCapabilitiesKHR(
      gpu, surface, capabilities
    ), 'vkGetPhysicalDeviceSurfaceCapabilitiesKHR');
    const formats = enumerate(vk.VkSurfaceFormatKHR, (count, values) =>
      vk.vkGetPhysicalDeviceSurfaceFormatsKHR(gpu, surface, count, values)
    );
    if (!formats.length) throw new Error('Vulkan surface has no color formats');
    const format = formats.find(item =>
      item.format === vk.VK_FORMAT_B8G8R8A8_UNORM &&
      item.colorSpace === vk.VK_COLOR_SPACE_SRGB_NONLINEAR_KHR
    ) ?? formats[0];
    this.format = format.format === vk.VK_FORMAT_UNDEFINED ?
      vk.VK_FORMAT_B8G8R8A8_UNORM : format.format;
    const modes = enumerate(null, (count, values) =>
      vk.vkGetPhysicalDeviceSurfacePresentModesKHR(gpu, surface, count, values)
    );
    const fixed = capabilities.currentExtent.width !== 0xffffffff;
    this.extent = new vk.VkExtent2D({
      width: fixed ? capabilities.currentExtent.width :
        Math.max(capabilities.minImageExtent.width,
          Math.min(size.x, capabilities.maxImageExtent.width)),
      height: fixed ? capabilities.currentExtent.height :
        Math.max(capabilities.minImageExtent.height,
          Math.min(size.y, capabilities.maxImageExtent.height)),
    });
    if (!this.extent.width || !this.extent.height) return false;
    const imageCount = Math.min(
      Math.max(2, capabilities.minImageCount),
      capabilities.maxImageCount || 0xffffffff
    );
    const compositeAlpha = [
      vk.VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR,
      vk.VK_COMPOSITE_ALPHA_PRE_MULTIPLIED_BIT_KHR,
      vk.VK_COMPOSITE_ALPHA_POST_MULTIPLIED_BIT_KHR,
      vk.VK_COMPOSITE_ALPHA_INHERIT_BIT_KHR,
    ].find(flag => capabilities.supportedCompositeAlpha & flag);
    const separateQueues = graphicsFamily !== presentFamily;
    this.handle = new vk.VkSwapchainKHR();
    check(vk.vkCreateSwapchainKHR(device, new vk.VkSwapchainCreateInfoKHR({
      surface,
      minImageCount: imageCount,
      imageFormat: this.format,
      imageColorSpace: format.colorSpace,
      imageExtent: this.extent,
      imageArrayLayers: 1,
      imageUsage: vk.VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT,
      imageSharingMode: separateQueues ? vk.VK_SHARING_MODE_CONCURRENT :
        vk.VK_SHARING_MODE_EXCLUSIVE,
      queueFamilyIndexCount: separateQueues ? 2 : 0,
      pQueueFamilyIndices: separateQueues ?
        new Uint32Array([ graphicsFamily, presentFamily ]) : null,
      preTransform: capabilities.currentTransform,
      compositeAlpha,
      presentMode: modes.includes(vk.VK_PRESENT_MODE_MAILBOX_KHR) ?
        vk.VK_PRESENT_MODE_MAILBOX_KHR : vk.VK_PRESENT_MODE_FIFO_KHR,
      clipped: true,
    }), null, this.handle), 'vkCreateSwapchainKHR');
    const handle = this.handle;
    this.scope.defer(() => vk.vkDestroySwapchainKHR(device, handle, null));
    return true;
  }

  /**
   * Pick an optimal-tiled depth format available on the selected device.
   * @return {number} VkFormat used for each image's depth attachment.
   */
  chooseDepthFormat() {
    for (const format of [
      vk.VK_FORMAT_D32_SFLOAT, vk.VK_FORMAT_D32_SFLOAT_S8_UINT,
      vk.VK_FORMAT_D24_UNORM_S8_UINT, vk.VK_FORMAT_D16_UNORM,
    ]) {
      const properties = new vk.VkFormatProperties();
      vk.vkGetPhysicalDeviceFormatProperties(this.context.gpu, format,
        properties);
      if (properties.optimalTilingFeatures &
          vk.VK_FORMAT_FEATURE_DEPTH_STENCIL_ATTACHMENT_BIT) return format;
    }
    throw new Error('No Vulkan depth attachment format is supported');
  }

  /** Give each swapchain image its own depth, uniform and present semaphore. */
  createTargets() {
    const { device } = this.context;
    const images = enumerate(vk.VkImage, (count, values) =>
      vk.vkGetSwapchainImagesKHR(device, this.handle, count, values)
    );
    this.targets = images.map(image => {
      const view = this.resources.createImageView(image, this.format,
        vk.VK_IMAGE_ASPECT_COLOR_BIT);
      const depth = this.resources.createImage(
        this.extent.width, this.extent.height, this.depthFormat,
        vk.VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT
      );
      const depthView = this.resources.createImageView(depth.image,
        this.depthFormat, vk.VK_IMAGE_ASPECT_DEPTH_BIT);
      const framebuffer = new vk.VkFramebuffer();
      check(vk.vkCreateFramebuffer(device, new vk.VkFramebufferCreateInfo({
        renderPass: this.pipeline.renderPass,
        attachmentCount: 2,
        pAttachments: [ view, depthView ],
        width: this.extent.width,
        height: this.extent.height,
        layers: 1,
      }), null, framebuffer), 'vkCreateFramebuffer');
      this.scope.defer(() => {
        vk.vkDestroyFramebuffer(device, framebuffer, null);
      });
      return {
        framebuffer,
        uniform: this.resources.createBuffer(192,
          vk.VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT,
          vk.VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT |
          vk.VK_MEMORY_PROPERTY_HOST_COHERENT_BIT),
        finished: this.createSemaphore(),
        inFlight: null,
      };
    });
  }

  /** Bind each image's uniform buffer and the common sampled logo texture. */
  createDescriptors() {
    const { device } = this.context;
    const count = this.targets.length;
    const pool = new vk.VkDescriptorPool();
    check(vk.vkCreateDescriptorPool(device, new vk.VkDescriptorPoolCreateInfo({
      maxSets: count,
      poolSizeCount: 2,
      pPoolSizes: [
        new vk.VkDescriptorPoolSize({
          type: vk.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, descriptorCount: count,
        }),
        new vk.VkDescriptorPoolSize({
          type: vk.VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
          descriptorCount: count,
        }),
      ],
    }), null, pool), 'vkCreateDescriptorPool');
    this.scope.defer(() => vk.vkDestroyDescriptorPool(device, pool, null));
    const sets = this.targets.map(() => new vk.VkDescriptorSet());
    const allocation = new vk.VkDescriptorSetAllocateInfo({
      descriptorPool: pool,
      descriptorSetCount: count,
      pSetLayouts: this.targets.map(() => this.pipeline.descriptorLayout),
    });
    check(vk.vkAllocateDescriptorSets(device, allocation, sets),
      'vkAllocateDescriptorSets');

    this.targets.forEach((target, index) => {
      target.descriptor = sets[index];
      const writes = [
        new vk.VkWriteDescriptorSet({
          dstSet: target.descriptor,
          dstBinding: 0,
          descriptorType: vk.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
          descriptorCount: 1,
          pBufferInfo: [ new vk.VkDescriptorBufferInfo({
            buffer: target.uniform.buffer, offset: 0n, range: 192n,
          }) ],
        }),
        new vk.VkWriteDescriptorSet({
          dstSet: target.descriptor,
          dstBinding: 1,
          descriptorType: vk.VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
          descriptorCount: 1,
          pImageInfo: [ new vk.VkDescriptorImageInfo({
            imageView: this.scene.texture.view,
            sampler: this.scene.texture.sampler,
            imageLayout: vk.VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
          }) ],
        }),
      ];
      vk.vkUpdateDescriptorSets(device, writes.length, writes, 0, null);
    });
  }

  /** Record the same indexed cube draw for every swapchain framebuffer. */
  createCommands() {
    const { device, commandPool } = this.context;
    const commands = this.targets.map(() => new vk.VkCommandBuffer());
    check(vk.vkAllocateCommandBuffers(device,
      new vk.VkCommandBufferAllocateInfo({
        commandPool,
        level: vk.VK_COMMAND_BUFFER_LEVEL_PRIMARY,
        commandBufferCount: commands.length,
      }), commands), 'vkAllocateCommandBuffers');
    this.scope.defer(() => {
      vk.vkFreeCommandBuffers(device, commandPool, commands.length, commands);
    });
    this.targets.forEach((target, index) => {
      const command = commands[index];
      target.command = command;
      check(vk.vkBeginCommandBuffer(command,
        new vk.VkCommandBufferBeginInfo()), 'vkBeginCommandBuffer');
      vk.vkCmdBeginRenderPass(command, new vk.VkRenderPassBeginInfo({
        renderPass: this.pipeline.renderPass,
        framebuffer: target.framebuffer,
        renderArea: new vk.VkRect2D({ extent: this.extent }),
        clearValueCount: 2,
        pClearValues: [
          new vk.VkClearValue({
            color: new vk.VkClearColorValue({ float32: [ 0, 0, 0, 0 ] }),
          }),
          new vk.VkClearValue({
            depthStencil: new vk.VkClearDepthStencilValue({
              depth: 1, stencil: 0,
            }),
          }),
        ],
      }), vk.VK_SUBPASS_CONTENTS_INLINE);
      vk.vkCmdBindPipeline(command, vk.VK_PIPELINE_BIND_POINT_GRAPHICS,
        this.pipeline.pipeline);
      vk.vkCmdBindVertexBuffers(command, 0, 1,
        [ this.scene.vertex.buffer ], new BigUint64Array([ 0n ]));
      vk.vkCmdBindIndexBuffer(command, this.scene.index.buffer, 0n,
        vk.VK_INDEX_TYPE_UINT16);
      vk.vkCmdBindDescriptorSets(command, vk.VK_PIPELINE_BIND_POINT_GRAPHICS,
        this.pipeline.layout, 0, 1, [ target.descriptor ], 0, null);
      vk.vkCmdDrawIndexed(command, 36, 1, 0, 0, 0);
      vk.vkCmdEndRenderPass(command);
      check(vk.vkEndCommandBuffer(command), 'vkEndCommandBuffer');
    });
  }

  /**
   * Allocate a binary queue semaphore.
   * @return {VkSemaphore} Semaphore owned by this swapchain generation.
   */
  createSemaphore() {
    const { device } = this.context;
    const semaphore = new vk.VkSemaphore();
    check(vk.vkCreateSemaphore(device, new vk.VkSemaphoreCreateInfo(), null,
      semaphore), 'vkCreateSemaphore');
    this.scope.defer(() => vk.vkDestroySemaphore(device, semaphore, null));
    return semaphore;
  }

  /**
   * Start signaled so the first frame has no preceding submission to await.
   * @return {VkFence} Fence owned by this swapchain generation.
   */
  createFence() {
    const { device } = this.context;
    const fence = new vk.VkFence();
    check(vk.vkCreateFence(device, new vk.VkFenceCreateInfo({
      flags: vk.VK_FENCE_CREATE_SIGNALED_BIT,
    }), null, fence), 'vkCreateFence');
    this.scope.defer(() => vk.vkDestroyFence(device, fence, null));
    return fence;
  }

  /**
   * Acquire, update and present without reusing an in-flight image's resources.
   * @param {number} elapsed Seconds since scene start.
   * @param {sf.Vector2i} mouse Window-relative pointer position.
   * @return {boolean} Whether an image was submitted for presentation.
   */
  draw(elapsed, mouse) {
    const size = this.context.window.getSize();
    if (!size.x || !size.y) return false;
    if (this.outOfDate && !this.recreate()) return false;
    const { device, graphicsQueue, presentQueue } = this.context;
    const frame = this.frames[this.currentFrame];
    check(vk.vkWaitForFences(device, 1, [ frame.fence ], true, forever),
      'vkWaitForFences');
    const acquired = { $: 0 };
    // A hidden surface must not block SFML's event loop indefinitely.
    const result = vk.vkAcquireNextImageKHR(device, this.handle, 16000000n,
      frame.available, null, acquired);
    if (result === vk.VK_TIMEOUT || result === vk.VK_NOT_READY) return false;
    if (result === vk.VK_ERROR_OUT_OF_DATE_KHR) {
      this.outOfDate = true;
      return false;
    }
    if (result !== vk.VK_SUBOPTIMAL_KHR) check(result, 'vkAcquireNextImageKHR');
    const target = this.targets[acquired.$];
    if (target.inFlight) {
      check(vk.vkWaitForFences(device, 1, [ target.inFlight ], true, forever),
        'vkWaitForFences(image)');
    }
    this.resources.writeBuffer(target.uniform, uniforms(elapsed, mouse, {
      x: this.extent.width, y: this.extent.height,
    }));

    // Reset only after acquisition succeeds; otherwise resize would deadlock.
    check(vk.vkResetFences(device, 1, [ frame.fence ]), 'vkResetFences');
    check(vk.vkQueueSubmit(graphicsQueue, 1, [ new vk.VkSubmitInfo({
      waitSemaphoreCount: 1,
      pWaitSemaphores: [ frame.available ],
      pWaitDstStageMask: new Int32Array([
        vk.VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT,
      ]),
      commandBufferCount: 1,
      pCommandBuffers: [ target.command ],
      signalSemaphoreCount: 1,
      pSignalSemaphores: [ target.finished ],
    }) ], frame.fence), 'vkQueueSubmit');
    target.inFlight = frame.fence;

    // This semaphore belongs to the acquired image, not the CPU frame slot.
    const presentation = new vk.VkPresentInfoKHR({
      waitSemaphoreCount: 1,
      pWaitSemaphores: [ target.finished ],
      swapchainCount: 1,
      pSwapchains: [ this.handle ],
      pImageIndices: new Uint32Array([ acquired.$ ]),
    });
    const presented = vk.vkQueuePresentKHR(presentQueue, presentation);
    if (presented === vk.VK_ERROR_OUT_OF_DATE_KHR ||
        presented === vk.VK_SUBOPTIMAL_KHR || result === vk.VK_SUBOPTIMAL_KHR) {
      this.outOfDate = true;
    } else {
      check(presented, 'vkQueuePresentKHR');
    }
    this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    return presented !== vk.VK_ERROR_OUT_OF_DATE_KHR;
  }

  /** Drain the device before releasing the current generation's resources. */
  dispose() {
    try {
      this.context.waitIdle();
    } finally {
      this.scope.dispose();
    }
  }
}

module.exports = Swapchain;
