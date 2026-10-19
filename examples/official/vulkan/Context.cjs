'use strict';

/* eslint no-bitwise: "off" */

const sf = require('../../..');
const { vk, check, enumerate, Scope } = require('./Common.cjs');

/** Connect an SFML window to a Vulkan instance, surface and graphics device. */
class Context {
  /**
   * Own the instance separately so partial initialization can be unwound.
   * @param {sf.Window} window SFML window retained until after disposal.
   */
  constructor(window) {
    this.window = window;
    this.scope = new Scope();
  }

  /** Create the Vulkan objects needed by both uploads and presentation. */
  initialize() {
    this.createInstance();
    this.surface = new vk.VkSurfaceKHR();
    // nvk's published .address type is absent in its 0.8.0 runtime.
    const instance = new DataView(this.instance.memoryBuffer).getBigUint64(0,
      true);
    const address = this.window.createVulkanSurface(instance);
    if (!address) throw new Error('SFML could not create a Vulkan surface');
    new DataView(this.surface.memoryBuffer).setBigUint64(0, address, true);
    this.scope.defer(() => {
      vk.vkDestroySurfaceKHR(this.instance, this.surface, null);
    });

    this.selectDevice();
    this.createDevice();
    this.memory = new vk.VkPhysicalDeviceMemoryProperties();
    vk.vkGetPhysicalDeviceMemoryProperties(this.gpu, this.memory);

    this.commandPool = new vk.VkCommandPool();
    check(vk.vkCreateCommandPool(this.device, new vk.VkCommandPoolCreateInfo({
      queueFamilyIndex: this.graphicsFamily,
      flags: vk.VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT,
    }), null, this.commandPool), 'vkCreateCommandPool');
    this.scope.defer(() => {
      vk.vkDestroyCommandPool(this.device, this.commandPool, null);
    });
  }

  /** Enable SFML's surface extensions and available Khronos validation. */
  createInstance() {
    const extensions = sf.Vulkan.getGraphicsRequiredInstanceExtensions();
    const available = enumerate(vk.VkLayerProperties,
      (count, values) => vk.vkEnumerateInstanceLayerProperties(count, values));
    const layers = available.some(layer =>
      layer.layerName === 'VK_LAYER_KHRONOS_validation'
    ) ? [ 'VK_LAYER_KHRONOS_validation' ] : [];

    this.instance = new vk.VkInstance();
    check(vk.vkCreateInstance(new vk.VkInstanceCreateInfo({
      pApplicationInfo: new vk.VkApplicationInfo({
        pApplicationName: 'SFML window with Vulkan',
        apiVersion: vk.VK_API_VERSION_1_0,
      }),
      enabledExtensionCount: extensions.length,
      ppEnabledExtensionNames: extensions,
      enabledLayerCount: layers.length,
      ppEnabledLayerNames: layers,
    }), null, this.instance), 'vkCreateInstance');
    this.scope.defer(() => vk.vkDestroyInstance(this.instance, null));
  }

  /** Find graphics and present queues, including separate queue families. */
  selectDevice() {
    const devices = enumerate(vk.VkPhysicalDevice, (count, values) =>
      vk.vkEnumeratePhysicalDevices(this.instance, count, values)
    );
    for (const gpu of devices) {
      const features = new vk.VkPhysicalDeviceFeatures();
      vk.vkGetPhysicalDeviceFeatures(gpu, features);
      const properties = new vk.VkPhysicalDeviceProperties();
      vk.vkGetPhysicalDeviceProperties(gpu, properties);
      if (!features.samplerAnisotropy ||
          properties.limits.maxSamplerAnisotropy < 4) continue;
      const extensions = enumerate(vk.VkExtensionProperties, (count, values) =>
        vk.vkEnumerateDeviceExtensionProperties(gpu, null, count, values)
      );
      if (!extensions.some(item => item.extensionName === 'VK_KHR_swapchain')) {
        continue;
      }

      const families = enumerate(vk.VkQueueFamilyProperties, (count, values) =>
        vk.vkGetPhysicalDeviceQueueFamilyProperties(gpu, count, values)
      );
      let graphicsFamily = -1;
      let presentFamily = -1;
      for (const [ index, family ] of families.entries()) {
        if (!family.queueCount) continue;
        const graphics = family.queueFlags & vk.VK_QUEUE_GRAPHICS_BIT;
        const present = { $: false };
        check(vk.vkGetPhysicalDeviceSurfaceSupportKHR(
          gpu, index, this.surface, present
        ), 'vkGetPhysicalDeviceSurfaceSupportKHR');
        if (graphics) graphicsFamily = index;
        if (present.$) presentFamily = index;
        if (graphics && present.$) {
          graphicsFamily = presentFamily = index;
          break;
        }
      }
      if (graphicsFamily < 0 || presentFamily < 0) continue;

      const formats = enumerate(vk.VkSurfaceFormatKHR, (count, values) =>
        vk.vkGetPhysicalDeviceSurfaceFormatsKHR(
          gpu, this.surface, count, values
        )
      );
      if (!formats.length) continue;
      this.gpu = gpu;
      this.graphicsFamily = graphicsFamily;
      this.presentFamily = presentFamily;
      return;
    }
    throw new Error('No suitable Vulkan device can present to the SFML window');
  }

  /** Request one queue from each required family and enable the swapchain. */
  createDevice() {
    const families = [ ...new Set([
      this.graphicsFamily, this.presentFamily,
    ]) ];
    const queues = families.map(queueFamilyIndex =>
      new vk.VkDeviceQueueCreateInfo({
        queueFamilyIndex,
        queueCount: 1,
        pQueuePriorities: new Float32Array([ 1 ]),
      })
    );
    this.device = new vk.VkDevice();
    check(vk.vkCreateDevice(this.gpu, new vk.VkDeviceCreateInfo({
      queueCreateInfoCount: queues.length,
      pQueueCreateInfos: queues,
      enabledExtensionCount: 1,
      ppEnabledExtensionNames: [ 'VK_KHR_swapchain' ],
      pEnabledFeatures: new vk.VkPhysicalDeviceFeatures({
        samplerAnisotropy: true,
      }),
    }), null, this.device), 'vkCreateDevice');
    this.deviceReady = true;
    this.scope.defer(() => vk.vkDestroyDevice(this.device, null));
    this.graphicsQueue = new vk.VkQueue();
    this.presentQueue = new vk.VkQueue();
    vk.vkGetDeviceQueue(this.device, this.graphicsFamily, 0,
      this.graphicsQueue);
    vk.vkGetDeviceQueue(this.device, this.presentFamily, 0, this.presentQueue);
  }

  /**
   * Select a memory heap that satisfies the buffer or image requirements.
   * @param {number} bits Allowed type mask.
   * @param {number} flags Required memory property flags.
   * @return {number} Compatible memory type index.
   */
  memoryType(bits, flags) {
    for (let i = 0; i < this.memory.memoryTypeCount; i++) {
      const properties = this.memory.memoryTypes[i].propertyFlags;
      if ((bits & (1 << i)) &&
          (properties & flags) === flags) return i;
    }
    throw new Error(`No Vulkan memory type matches flags ${flags}`);
  }

  /**
   * Execute a one-time upload and wait before releasing staging resources.
   * @param {Function} record Function that records commands into the buffer.
   */
  runCommands(record) {
    const command = new vk.VkCommandBuffer();
    check(vk.vkAllocateCommandBuffers(this.device,
      new vk.VkCommandBufferAllocateInfo({
        commandPool: this.commandPool,
        level: vk.VK_COMMAND_BUFFER_LEVEL_PRIMARY,
        commandBufferCount: 1,
      }), [ command ]), 'vkAllocateCommandBuffers');
    try {
      check(vk.vkBeginCommandBuffer(command, new vk.VkCommandBufferBeginInfo({
        flags: vk.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT,
      })), 'vkBeginCommandBuffer');
      record(command);
      check(vk.vkEndCommandBuffer(command), 'vkEndCommandBuffer');
      check(vk.vkQueueSubmit(this.graphicsQueue, 1, [ new vk.VkSubmitInfo({
        commandBufferCount: 1,
        pCommandBuffers: [ command ],
      }) ], null), 'vkQueueSubmit');
      check(vk.vkQueueWaitIdle(this.graphicsQueue), 'vkQueueWaitIdle');
    } finally {
      vk.vkFreeCommandBuffers(this.device, this.commandPool, 1, [ command ]);
    }
  }

  /** Wait before any owned GPU resources are destroyed. */
  waitIdle() {
    if (this.deviceReady) {
      check(vk.vkDeviceWaitIdle(this.device), 'vkDeviceWaitIdle');
    }
  }

  /** Release command pool, device, surface and instance, in that order. */
  dispose() {
    try {
      this.waitIdle();
    } finally {
      this.scope.dispose();
      this.deviceReady = false;
    }
  }
}

module.exports = Context;
