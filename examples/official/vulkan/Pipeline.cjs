'use strict';

/* eslint no-bitwise: "off" */

const { vk, check } = require('./Common.cjs');

/**
 * Build the official textured, colored, depth-tested cube pipeline.
 * @param {Context} context Vulkan device owner.
 * @param {Scope} scope Swapchain resource lifetime.
 * @param {number} colorFormat Surface format.
 * @param {number} depthFormat Depth attachment format.
 * @param {VkExtent2D} extent Drawable dimensions.
 * @param {Uint8Array[]} shaders Original vertex and fragment SPIR-V.
 * @return {object} Render pass, pipeline and descriptor layouts.
 */
module.exports = function createPipeline(
  context, scope, colorFormat, depthFormat, extent, shaders
) {
  const { device } = context;
  const descriptorLayout = new vk.VkDescriptorSetLayout();
  const bindings = [
    new vk.VkDescriptorSetLayoutBinding({
      binding: 0,
      descriptorType: vk.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
      descriptorCount: 1,
      stageFlags: vk.VK_SHADER_STAGE_VERTEX_BIT,
    }),
    new vk.VkDescriptorSetLayoutBinding({
      binding: 1,
      descriptorType: vk.VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
      descriptorCount: 1,
      stageFlags: vk.VK_SHADER_STAGE_FRAGMENT_BIT,
    }),
  ];
  check(vk.vkCreateDescriptorSetLayout(device,
    new vk.VkDescriptorSetLayoutCreateInfo({
      bindingCount: bindings.length,
      pBindings: bindings,
    }), null, descriptorLayout), 'vkCreateDescriptorSetLayout');
  scope.defer(() => vk.vkDestroyDescriptorSetLayout(device, descriptorLayout,
    null));

  const layout = new vk.VkPipelineLayout();
  check(vk.vkCreatePipelineLayout(device, new vk.VkPipelineLayoutCreateInfo({
    setLayoutCount: 1,
    pSetLayouts: [ descriptorLayout ],
  }), null, layout), 'vkCreatePipelineLayout');
  scope.defer(() => vk.vkDestroyPipelineLayout(device, layout, null));

  const attachments = [
    new vk.VkAttachmentDescription({
      format: colorFormat,
      samples: vk.VK_SAMPLE_COUNT_1_BIT,
      loadOp: vk.VK_ATTACHMENT_LOAD_OP_CLEAR,
      storeOp: vk.VK_ATTACHMENT_STORE_OP_STORE,
      stencilLoadOp: vk.VK_ATTACHMENT_LOAD_OP_DONT_CARE,
      stencilStoreOp: vk.VK_ATTACHMENT_STORE_OP_DONT_CARE,
      initialLayout: vk.VK_IMAGE_LAYOUT_UNDEFINED,
      finalLayout: vk.VK_IMAGE_LAYOUT_PRESENT_SRC_KHR,
    }),
    new vk.VkAttachmentDescription({
      format: depthFormat,
      samples: vk.VK_SAMPLE_COUNT_1_BIT,
      loadOp: vk.VK_ATTACHMENT_LOAD_OP_CLEAR,
      storeOp: vk.VK_ATTACHMENT_STORE_OP_DONT_CARE,
      stencilLoadOp: vk.VK_ATTACHMENT_LOAD_OP_DONT_CARE,
      stencilStoreOp: vk.VK_ATTACHMENT_STORE_OP_DONT_CARE,
      initialLayout: vk.VK_IMAGE_LAYOUT_UNDEFINED,
      finalLayout: vk.VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL,
    }),
  ];
  const stages = vk.VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT |
    vk.VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT |
    vk.VK_PIPELINE_STAGE_LATE_FRAGMENT_TESTS_BIT;
  const renderPass = new vk.VkRenderPass();
  check(vk.vkCreateRenderPass(device, new vk.VkRenderPassCreateInfo({
    attachmentCount: attachments.length,
    pAttachments: attachments,
    subpassCount: 1,
    pSubpasses: [ new vk.VkSubpassDescription({
      pipelineBindPoint: vk.VK_PIPELINE_BIND_POINT_GRAPHICS,
      colorAttachmentCount: 1,
      pColorAttachments: [ new vk.VkAttachmentReference({
        attachment: 0,
        layout: vk.VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
      }) ],
      pDepthStencilAttachment: new vk.VkAttachmentReference({
        attachment: 1,
        layout: vk.VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL,
      }),
    }) ],
    dependencyCount: 1,
    pDependencies: [ new vk.VkSubpassDependency({
      srcSubpass: vk.VK_SUBPASS_EXTERNAL,
      dstSubpass: 0,
      srcStageMask: stages,
      dstStageMask: stages,
      srcAccessMask: vk.VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT |
        vk.VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT,
      dstAccessMask: vk.VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT |
        vk.VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT,
    }) ],
  }), null, renderPass), 'vkCreateRenderPass');
  scope.defer(() => vk.vkDestroyRenderPass(device, renderPass, null));

  const shaderStages = shaders.map((code, index) => {
    const module = new vk.VkShaderModule();
    check(vk.vkCreateShaderModule(device, new vk.VkShaderModuleCreateInfo({
      codeSize: code.byteLength,
      pCode: code,
    }), null, module), 'vkCreateShaderModule');
    scope.defer(() => vk.vkDestroyShaderModule(device, module, null));
    return new vk.VkPipelineShaderStageCreateInfo({
      stage: index ? vk.VK_SHADER_STAGE_FRAGMENT_BIT :
        vk.VK_SHADER_STAGE_VERTEX_BIT,
      module,
      pName: 'main',
    });
  });
  const attributes = [
    [ vk.VK_FORMAT_R32G32B32_SFLOAT, 0 ],
    [ vk.VK_FORMAT_R32G32B32A32_SFLOAT, 12 ],
    [ vk.VK_FORMAT_R32G32_SFLOAT, 28 ],
  ].map(([ format, offset ], location) =>
    new vk.VkVertexInputAttributeDescription({
      binding: 0, location, format, offset,
    })
  );
  const pipeline = new vk.VkPipeline();
  check(vk.vkCreateGraphicsPipelines(device, null, 1, [
    new vk.VkGraphicsPipelineCreateInfo({
      stageCount: shaderStages.length,
      pStages: shaderStages,
      pVertexInputState: new vk.VkPipelineVertexInputStateCreateInfo({
        vertexBindingDescriptionCount: 1,
        pVertexBindingDescriptions: [ new vk.VkVertexInputBindingDescription({
          binding: 0,
          stride: 36,
          inputRate: vk.VK_VERTEX_INPUT_RATE_VERTEX,
        }) ],
        vertexAttributeDescriptionCount: attributes.length,
        pVertexAttributeDescriptions: attributes,
      }),
      pInputAssemblyState: new vk.VkPipelineInputAssemblyStateCreateInfo({
        topology: vk.VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST,
      }),
      pViewportState: new vk.VkPipelineViewportStateCreateInfo({
        viewportCount: 1,
        pViewports: [ new vk.VkViewport({
          width: extent.width,
          height: extent.height,
          minDepth: 0,
          maxDepth: 1,
        }) ],
        scissorCount: 1,
        pScissors: [ new vk.VkRect2D({ extent }) ],
      }),
      pRasterizationState: new vk.VkPipelineRasterizationStateCreateInfo({
        polygonMode: vk.VK_POLYGON_MODE_FILL,
        lineWidth: 1,
        cullMode: vk.VK_CULL_MODE_NONE,
        frontFace: vk.VK_FRONT_FACE_COUNTER_CLOCKWISE,
      }),
      pDepthStencilState: new vk.VkPipelineDepthStencilStateCreateInfo({
        depthTestEnable: true,
        depthWriteEnable: true,
        depthCompareOp: vk.VK_COMPARE_OP_LESS,
      }),
      pMultisampleState: new vk.VkPipelineMultisampleStateCreateInfo({
        rasterizationSamples: vk.VK_SAMPLE_COUNT_1_BIT,
      }),
      pColorBlendState: new vk.VkPipelineColorBlendStateCreateInfo({
        attachmentCount: 1,
        pAttachments: [ new vk.VkPipelineColorBlendAttachmentState({
          blendEnable: true,
          srcColorBlendFactor: vk.VK_BLEND_FACTOR_SRC_ALPHA,
          dstColorBlendFactor: vk.VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA,
          colorBlendOp: vk.VK_BLEND_OP_ADD,
          srcAlphaBlendFactor: vk.VK_BLEND_FACTOR_ONE,
          dstAlphaBlendFactor: vk.VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA,
          alphaBlendOp: vk.VK_BLEND_OP_ADD,
          colorWriteMask: vk.VK_COLOR_COMPONENT_R_BIT |
            vk.VK_COLOR_COMPONENT_G_BIT | vk.VK_COLOR_COMPONENT_B_BIT |
            vk.VK_COLOR_COMPONENT_A_BIT,
        }) ],
      }),
      layout,
      renderPass,
      subpass: 0,
      basePipelineIndex: -1,
    }),
  ], null, [ pipeline ]), 'vkCreateGraphicsPipelines');
  scope.defer(() => vk.vkDestroyPipeline(device, pipeline, null));
  return { descriptorLayout, layout, renderPass, pipeline };
};
