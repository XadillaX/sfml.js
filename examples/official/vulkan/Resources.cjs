'use strict';

/* eslint no-bitwise: "off" */

const { vk, check, Scope } = require('./Common.cjs');

/** Vulkan buffer, image and texture allocation owned by a caller's scope. */
class Resources {
  /**
   * Share the device and synchronous command submission supplied by Context.
   * @param {Context} context Device, memory selection and command helpers.
   * @param {Scope} scope Lifetime of successfully created resources.
   */
  constructor(context, scope) {
    /** Device and queue operations shared with the rest of the example. */
    this.context = context;
    /** Cleanup owner; dependent objects are registered after their inputs. */
    this.scope = scope;
  }

  /**
   * Create a buffer and bind memory with the requested property flags.
   * @param {number} size Buffer size in bytes.
   * @param {number} usage Vulkan buffer usage flags.
   * @param {number} properties Required memory property flags.
   * @return {object} Buffer handle, memory handle and byte size.
   */
  createBuffer(size, usage, properties) {
    if (!Number.isSafeInteger(size) || size <= 0) {
      throw new RangeError('Buffer size must be a positive safe integer');
    }
    const { device } = this.context;
    const info = new vk.VkBufferCreateInfo({
      size: BigInt(size),
      usage,
      sharingMode: vk.VK_SHARING_MODE_EXCLUSIVE,
    });
    const buffer = new vk.VkBuffer();
    check(vk.vkCreateBuffer(device, info, null, buffer), 'Create buffer');

    let memory;
    // A single callback preserves buffer-before-memory order on every path.
    const release = () => {
      vk.vkDestroyBuffer(device, buffer, null);
      if (memory) vk.vkFreeMemory(device, memory, null);
    };
    try {
      const requirements = new vk.VkMemoryRequirements();
      vk.vkGetBufferMemoryRequirements(device, buffer, requirements);
      memory = this._allocateMemory(requirements, properties);
      check(vk.vkBindBufferMemory(device, buffer, memory, 0n),
        'Bind buffer memory');
      this.scope.defer(release);
      return { buffer, memory, size };
    } catch (error) {
      release();
      throw error;
    }
  }

  /**
   * Copy a typed-array byte range into host-visible, coherent buffer memory.
   * @param {object} resource Buffer resource returned by createBuffer.
   * @param {TypedArray} data Source view; its byte offset is respected.
   */
  writeBuffer(resource, data) {
    if (data.byteLength > resource.size) {
      throw new RangeError('Upload is larger than the buffer size');
    }
    if (!data.byteLength) return;
    const { device } = this.context;
    const pointer = { $: 0n };
    check(vk.vkMapMemory(
      device, resource.memory, 0n, BigInt(data.byteLength), 0, pointer
    ), 'Map buffer memory');
    try {
      const mapping = ArrayBuffer.fromAddress(pointer.$, data.byteLength);
      const source = new Uint8Array(
        data.buffer, data.byteOffset, data.byteLength
      );
      new Uint8Array(mapping).set(source);
    } finally {
      vk.vkUnmapMemory(device, resource.memory);
    }
  }

  /**
   * Upload vertex or index bytes through a temporary host-visible buffer.
   * @param {TypedArray} data Source view to copy.
   * @param {number} usage Final Vulkan buffer usage flags.
   * @return {object} Device-local buffer resource owned by this scope.
   */
  uploadBuffer(data, usage) {
    const temporary = new Scope();
    const retained = new Scope();
    const stagingResources = new Resources(this.context, temporary);
    const deviceResources = new Resources(this.context, retained);
    try {
      const staging = stagingResources.createBuffer(
        data.byteLength,
        vk.VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
        vk.VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT |
          vk.VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
      );
      stagingResources.writeBuffer(staging, data);
      const destination = deviceResources.createBuffer(
        data.byteLength,
        usage | vk.VK_BUFFER_USAGE_TRANSFER_DST_BIT,
        vk.VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT
      );
      const region = new vk.VkBufferCopy({
        srcOffset: 0n,
        dstOffset: 0n,
        size: BigInt(data.byteLength),
      });
      this.context.runCommands(command => {
        vk.vkCmdCopyBuffer(command, staging.buffer, destination.buffer,
          1, [ region ]);
      });
      this.scope.defer(() => retained.dispose());
      return destination;
    } catch (error) {
      retained.dispose();
      throw error;
    } finally {
      temporary.dispose();
    }
  }

  /**
   * Create an optimal-tiled, single-level 2D image in device-local memory.
   * @param {number} width Image width in pixels.
   * @param {number} height Image height in pixels.
   * @param {number} format Vulkan image format.
   * @param {number} usage Vulkan image usage flags.
   * @return {object} Image and memory handles owned by this scope.
   */
  createImage(width, height, format, usage) {
    const { device } = this.context;
    const info = new vk.VkImageCreateInfo({
      imageType: vk.VK_IMAGE_TYPE_2D,
      format,
      mipLevels: 1,
      arrayLayers: 1,
      samples: vk.VK_SAMPLE_COUNT_1_BIT,
      tiling: vk.VK_IMAGE_TILING_OPTIMAL,
      usage,
      sharingMode: vk.VK_SHARING_MODE_EXCLUSIVE,
      initialLayout: vk.VK_IMAGE_LAYOUT_UNDEFINED,
    });
    info.extent.width = width;
    info.extent.height = height;
    info.extent.depth = 1;
    const image = new vk.VkImage();
    check(vk.vkCreateImage(device, info, null, image), 'Create image');

    let memory;
    const release = () => {
      vk.vkDestroyImage(device, image, null);
      if (memory) vk.vkFreeMemory(device, memory, null);
    };
    try {
      const requirements = new vk.VkMemoryRequirements();
      vk.vkGetImageMemoryRequirements(device, image, requirements);
      memory = this._allocateMemory(requirements,
        vk.VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT);
      check(vk.vkBindImageMemory(device, image, memory, 0n),
        'Bind image memory');
      this.scope.defer(release);
      return { image, memory };
    } catch (error) {
      release();
      throw error;
    }
  }

  /**
   * Expose one image level and layer for color or depth/stencil access.
   * @param {VkImage} image Image handle; must outlive the returned view.
   * @param {number} format Vulkan image format.
   * @param {number} aspect Color or depth/stencil aspect flags.
   * @return {VkImageView} View handle owned by this scope.
   */
  createImageView(image, format, aspect) {
    const { device } = this.context;
    const info = new vk.VkImageViewCreateInfo({
      image,
      viewType: vk.VK_IMAGE_VIEW_TYPE_2D,
      format,
    });
    info.subresourceRange.aspectMask = aspect;
    info.subresourceRange.baseMipLevel = 0;
    info.subresourceRange.levelCount = 1;
    info.subresourceRange.baseArrayLayer = 0;
    info.subresourceRange.layerCount = 1;
    const view = new vk.VkImageView();
    check(vk.vkCreateImageView(device, info, null, view), 'Create image view');
    this.scope.defer(() => vk.vkDestroyImageView(device, view, null));
    return view;
  }

  /**
   * Upload an SFML RGBA image and create the upstream linear 4x sampler.
   * @param {sf.Image} image Loaded SFML image with nonempty pixel storage.
   * @return {object} Shader-readable image view and sampler handles.
   */
  createTexture(image) {
    const size = image.getSize();
    const pixels = image.getPixelsPtr();
    if (!pixels || !size.x || !size.y) {
      throw new Error('Texture image has no pixels');
    }
    const temporary = new Scope();
    const retained = new Scope();
    const stagingResources = new Resources(this.context, temporary);
    const textureResources = new Resources(this.context, retained);
    try {
      const staging = stagingResources.createBuffer(
        size.x * size.y * 4,
        vk.VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
        vk.VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT |
          vk.VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
      );
      stagingResources.writeBuffer(staging, pixels);
      const format = vk.VK_FORMAT_R8G8B8A8_UNORM;
      const texture = textureResources.createImage(
        size.x, size.y, format,
        vk.VK_IMAGE_USAGE_TRANSFER_DST_BIT | vk.VK_IMAGE_USAGE_SAMPLED_BIT
      );
      this._uploadImage(staging.buffer, texture.image, size);
      const view = textureResources.createImageView(
        texture.image, format, vk.VK_IMAGE_ASPECT_COLOR_BIT
      );
      const sampler = textureResources._createSampler();
      this.scope.defer(() => retained.dispose());
      return { view, sampler };
    } catch (error) {
      retained.dispose();
      throw error;
    } finally {
      temporary.dispose();
    }
  }

  /**
   * Allocate memory matching a buffer or image's native requirements.
   * @param {VkMemoryRequirements} requirements Native size and type bits.
   * @param {number} properties Required memory property flags.
   * @return {VkDeviceMemory} Allocation to be owned by the calling resource.
   * @private
   */
  _allocateMemory(requirements, properties) {
    const info = new vk.VkMemoryAllocateInfo({
      allocationSize: BigInt(requirements.size),
      memoryTypeIndex: this.context.memoryType(
        requirements.memoryTypeBits, properties
      ),
    });
    const memory = new vk.VkDeviceMemory();
    check(vk.vkAllocateMemory(this.context.device, info, null, memory),
      'Allocate memory');
    return memory;
  }

  /**
   * Record the two upstream layout barriers around a tightly packed RGBA copy.
   * @param {VkBuffer} buffer Staging buffer retained until submission finishes.
   * @param {VkImage} image Destination in the undefined layout.
   * @param {sf.Vector2u} size Texture dimensions.
   * @private
   */
  _uploadImage(buffer, image, size) {
    const before = new vk.VkImageMemoryBarrier({
      image,
      oldLayout: vk.VK_IMAGE_LAYOUT_UNDEFINED,
      newLayout: vk.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
      srcQueueFamilyIndex: vk.VK_QUEUE_FAMILY_IGNORED,
      dstQueueFamilyIndex: vk.VK_QUEUE_FAMILY_IGNORED,
      srcAccessMask: 0,
      dstAccessMask: vk.VK_ACCESS_TRANSFER_WRITE_BIT,
    });
    before.subresourceRange.aspectMask = vk.VK_IMAGE_ASPECT_COLOR_BIT;
    before.subresourceRange.baseMipLevel = 0;
    before.subresourceRange.levelCount = 1;
    before.subresourceRange.baseArrayLayer = 0;
    before.subresourceRange.layerCount = 1;

    const copy = new vk.VkBufferImageCopy({ bufferOffset: 0n });
    copy.bufferRowLength = 0;
    copy.bufferImageHeight = 0;
    copy.imageSubresource.aspectMask = vk.VK_IMAGE_ASPECT_COLOR_BIT;
    copy.imageSubresource.mipLevel = 0;
    copy.imageSubresource.baseArrayLayer = 0;
    copy.imageSubresource.layerCount = 1;
    copy.imageOffset.x = 0;
    copy.imageOffset.y = 0;
    copy.imageOffset.z = 0;
    copy.imageExtent.width = size.x;
    copy.imageExtent.height = size.y;
    copy.imageExtent.depth = 1;

    const after = new vk.VkImageMemoryBarrier({
      image,
      oldLayout: vk.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
      newLayout: vk.VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
      srcQueueFamilyIndex: vk.VK_QUEUE_FAMILY_IGNORED,
      dstQueueFamilyIndex: vk.VK_QUEUE_FAMILY_IGNORED,
      srcAccessMask: vk.VK_ACCESS_TRANSFER_WRITE_BIT,
      dstAccessMask: vk.VK_ACCESS_SHADER_READ_BIT,
    });
    after.subresourceRange = before.subresourceRange;
    this.context.runCommands(command => {
      vk.vkCmdPipelineBarrier(command,
        vk.VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT,
        vk.VK_PIPELINE_STAGE_TRANSFER_BIT,
        0, 0, null, 0, null, 1, [ before ]);
      vk.vkCmdCopyBufferToImage(command, buffer, image,
        vk.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, 1, [ copy ]);
      vk.vkCmdPipelineBarrier(command,
        vk.VK_PIPELINE_STAGE_TRANSFER_BIT,
        vk.VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,
        0, 0, null, 0, null, 1, [ after ]);
    });
  }

  /**
   * Create the exact upstream repeat, linear and fourfold-anisotropic sampler.
   * @return {VkSampler} Sampler handle owned by this scope.
   * @private
   */
  _createSampler() {
    const { device } = this.context;
    const info = new vk.VkSamplerCreateInfo({
      magFilter: vk.VK_FILTER_LINEAR,
      minFilter: vk.VK_FILTER_LINEAR,
      addressModeU: vk.VK_SAMPLER_ADDRESS_MODE_REPEAT,
      addressModeV: vk.VK_SAMPLER_ADDRESS_MODE_REPEAT,
      addressModeW: vk.VK_SAMPLER_ADDRESS_MODE_REPEAT,
      anisotropyEnable: vk.VK_TRUE,
      maxAnisotropy: 4,
      borderColor: vk.VK_BORDER_COLOR_INT_OPAQUE_BLACK,
      unnormalizedCoordinates: vk.VK_FALSE,
      compareEnable: vk.VK_FALSE,
      compareOp: vk.VK_COMPARE_OP_ALWAYS,
      mipmapMode: vk.VK_SAMPLER_MIPMAP_MODE_LINEAR,
      mipLodBias: 0,
      minLod: 0,
      maxLod: 0,
    });
    const sampler = new vk.VkSampler();
    check(vk.vkCreateSampler(device, info, null, sampler), 'Create sampler');
    this.scope.defer(() => vk.vkDestroySampler(device, sampler, null));
    return sampler;
  }
}

module.exports = Resources;
