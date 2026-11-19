# RmlUi 6.3 绑定源码清单

此清单为 2026-11-16 性能改造前的完整语法清点。
详见[架构与性能审计](architecture-performance.md)。
数量表示源码位置，不表示动态调用次数或上游 API 覆盖率。
模板入口、转调及生成字段的具体符号和源码指纹保存在
[JSON 清单](architecture-inventory.json)。

## 全部 TypeScript 模块

| 文件 | 导出声明 | Native 调用位置 |
| --- | --- | ---: |
| [animation-values.ts](../../../../packages/sfml.js-rmlui/src/animation-values.ts) | Animation、Transition、TransitionList、AnimationList | 6 |
| [attributes.ts](../../../../packages/sfml.js-rmlui/src/attributes.ts) | AttributeValue、AttributeResult | 0 |
| [box.ts](../../../../packages/sfml.js-rmlui/src/box.ts) | BoxEdge、BoxDirection、Box、PositionedBox | 12 |
| [callback-texture.ts](../../../../packages/sfml.js-rmlui/src/callback-texture.ts) | CallbackTextureFunction、TextureHandle、CallbackTextureInterface、CallbackTexture、CallbackTextureSource | 13 |
| [compiled-resources.ts](../../../../packages/sfml.js-rmlui/src/compiled-resources.ts) | CompiledFilter、CompiledShader、FilterHandleList | 10 |
| [computed-values.ts](../../../../packages/sfml.js-rmlui/src/computed-values.ts) | ComputedValuesView、ComputedValues | 4 |
| [context-instancer.ts](../../../../packages/sfml.js-rmlui/src/context-instancer.ts) | ContextReleaseSnapshot、ContextInstanceCallback、ContextReleaseCallback、ContextInstancer | 3 |
| [context.ts](../../../../packages/sfml.js-rmlui/src/context.ts) | ContextDimensions、Context | 51 |
| [core.ts](../../../../packages/sfml.js-rmlui/src/core.ts) | InitialiseOptions | 7 |
| [data-accessors.ts](../../../../packages/sfml.js-rmlui/src/data-accessors.ts) | DataTypeGetFunc、DataTypeSetFunc、DataEventMemberFunc、MemberGetFunc、MemberSetFunc、MemberGetterFunc、MemberSetterFunc、VoidMemberFunc、DataMemberGetter、DataMemberSetter、DataScalarDefinition | 0 |
| [data-address.ts](../../../../packages/sfml.js-rmlui/src/data-address.ts) | DataAddressEntry、DataAddress、DirtyVariables | 0 |
| [data-controller.ts](../../../../packages/sfml.js-rmlui/src/data-controller.ts) | DataControllerCallbacks、DataController | 5 |
| [data-custom.ts](../../../../packages/sfml.js-rmlui/src/data-custom.ts) | DataGetResult、DataCustomDefinition | 0 |
| [data-instancers.ts](../../../../packages/sfml.js-rmlui/src/data-instancers.ts) | DataViewInstanceCallback、DataControllerInstanceCallback、DataViewInstancer、DataControllerInstancer | 4 |
| [data-model.ts](../../../../packages/sfml.js-rmlui/src/data-model.ts) | DataScalarValue、DataVariantValue、DataVariableType、DataGetFunc、DataSetFunc、DataTransformFunc、DataEventFunc、DataModelOptions、DataModelHandle、DataVariable、DataModelConstructor | 31 |
| [data-schema.ts](../../../../packages/sfml.js-rmlui/src/data-schema.ts) | DataScalarKind、DataEnumKind、DataNumericView、DataStorageValue、DataStorageRecord、DataSchema、DataStructHandle、DataTypeRegister | 19 |
| [data-transforms.ts](../../../../packages/sfml.js-rmlui/src/data-transforms.ts) | DataTransformResult、TransformFuncRegister | 3 |
| [data-view.ts](../../../../packages/sfml.js-rmlui/src/data-view.ts) | DataBindingInitialize、DataBindingRelease、DataViewCallbacks、DataView | 8 |
| [decoration-values.ts](../../../../packages/sfml.js-rmlui/src/decoration-values.ts) | NumericValueSnapshot、PremultipliedColour、ColorStop、ColorStopList、BoxShadow、BoxShadowList | 0 |
| [decorator-instancer-interface.ts](../../../../packages/sfml.js-rmlui/src/decorator-instancer-interface.ts) | DecoratorInstancerInterface | 4 |
| [decorator.ts](../../../../packages/sfml.js-rmlui/src/decorator.ts) | DecoratorCallbacks、DecoratorData、Decorator | 8 |
| [document-flags.ts](../../../../packages/sfml.js-rmlui/src/document-flags.ts) | ModalFlag、FocusFlag、ScrollFlag、ScrollBehavior | 0 |
| [document.ts](../../../../packages/sfml.js-rmlui/src/document.ts) | Document | 18 |
| [effect-instancers.ts](../../../../packages/sfml.js-rmlui/src/effect-instancers.ts) | DecoratorInstancerCallback、DecoratorInstancer、FilterInstancerCallback、FilterInstancer | 14 |
| [effect-values.ts](../../../../packages/sfml.js-rmlui/src/effect-values.ts) | EffectType、NativeEffectValue、NativeEffectFields、EffectProperty、FilterDeclaration、DecoratorDeclaration、FontEffectLayer、FontEffectSnapshot、DecoratorList、FilterList、FontEffectList | 13 |
| [element-definition.ts](../../../../packages/sfml.js-rmlui/src/element-definition.ts) | ElementDefinition | 4 |
| [element-instancer.ts](../../../../packages/sfml.js-rmlui/src/element-instancer.ts) | ElementReleaseSnapshot、ElementInstanceCallback、ElementReleaseCallback、ElementInstancer | 3 |
| [element-text.ts](../../../../packages/sfml.js-rmlui/src/element-text.ts) | GeneratedTextLine、TextLine、ElementText | 7 |
| [element-utilities.ts](../../../../packages/sfml.js-rmlui/src/element-utilities.ts) | PositionAnchor、ClipMaskOperation、ElementRectangle、ClipMaskGeometry、ElementClippingRegion、ElementUtilities | 13 |
| [element.ts](../../../../packages/sfml.js-rmlui/src/element.ts) | IntrinsicDimensions、Element | 115 |
| [event-instancer.ts](../../../../packages/sfml.js-rmlui/src/event-instancer.ts) | EventReleaseSnapshot、EventInstanceCallback、EventReleaseCallback、EventInstancer | 3 |
| [event-listener-instancer.ts](../../../../packages/sfml.js-rmlui/src/event-listener-instancer.ts) | EventListenerInstanceCallback、EventListenerInstancer | 2 |
| [event-listener.ts](../../../../packages/sfml.js-rmlui/src/event-listener.ts) | EventListenerAttachment、EventListenerHook、EventListener | 5 |
| [event.ts](../../../../packages/sfml.js-rmlui/src/event.ts) | DefaultActionPhase、EventPhase、DispatchEventOptions、RmlEvent | 10 |
| [factory.ts](../../../../packages/sfml.js-rmlui/src/factory.ts) | Factory | 23 |
| [filter.ts](../../../../packages/sfml.js-rmlui/src/filter.ts) | FilterOverflow、FilterCallbacks、Filter | 3 |
| [font-effect-instancer.ts](../../../../packages/sfml.js-rmlui/src/font-effect-instancer.ts) | FontEffectInstancerCallback、FontEffectInstancer | 7 |
| [font-effect.ts](../../../../packages/sfml.js-rmlui/src/font-effect.ts) | FontGlyphMetrics、FontEffectCallbacks、FontEffect | 12 |
| [font-glyph.ts](../../../../packages/sfml.js-rmlui/src/font-glyph.ts) | FontGlyphMap、ColorFormat、FontGlyph | 6 |
| [fonts.ts](../../../../packages/sfml.js-rmlui/src/fonts.ts) | FontStyle、FontWeight | 2 |
| [form-control-input.ts](../../../../packages/sfml.js-rmlui/src/form-control-input.ts) | ElementFormControlInput | 4 |
| [form-control-select.ts](../../../../packages/sfml.js-rmlui/src/form-control-select.ts) | ElementFormControlSelect | 12 |
| [form-control-text-area.ts](../../../../packages/sfml.js-rmlui/src/form-control-text-area.ts) | ElementFormControlTextArea | 12 |
| [form-control.ts](../../../../packages/sfml.js-rmlui/src/form-control.ts) | ElementFormControl、TextSelection | 7 |
| [form.ts](../../../../packages/sfml.js-rmlui/src/form.ts) | ElementForm | 1 |
| [computed-binding.ts](../../../../packages/sfml.js-rmlui/src/gen/computed-binding.ts) | ComputedBinding | 0 |
| [computed-fields.ts](../../../../packages/sfml.js-rmlui/src/gen/computed-fields.ts) | ComputedFields | 180 |
| [events.ts](../../../../packages/sfml.js-rmlui/src/gen/events.ts) | EventId | 0 |
| [input.ts](../../../../packages/sfml.js-rmlui/src/gen/input.ts) | KeyIdentifier、KeyModifier | 0 |
| [property-ids.ts](../../../../packages/sfml.js-rmlui/src/gen/property-ids.ts) | PropertyId | 0 |
| [shorthand-ids.ts](../../../../packages/sfml.js-rmlui/src/gen/shorthand-ids.ts) | ShorthandId | 0 |
| [style-enums.ts](../../../../packages/sfml.js-rmlui/src/gen/style-enums.ts) | Display、Position、Float、Clear、BoxSizing、Overflow、Visibility、TextOverflow、FontStyle、FontWeight、FontKerning、TextAlign、TextDecoration、TextTransform、WhiteSpace、WordBreak、Drag、TabIndex、Focus、OverscrollBehavior、PointerEvents、OriginX、OriginY、AlignContent、AlignItems、AlignSelf、FlexDirection、FlexWrap、JustifyContent、Nav、Direction、LengthPercentageAutoType、LengthPercentageType、NumberAutoType、VerticalAlignType、LineHeightInheritType、ClipType | 0 |
| [style-scalars.ts](../../../../packages/sfml.js-rmlui/src/gen/style-scalars.ts) | LengthPercentageAuto、LengthPercentage、NumberAuto、VerticalAlign、LineHeight | 5 |
| [style-struct-binding.ts](../../../../packages/sfml.js-rmlui/src/gen/style-struct-binding.ts) | StyleStructBinding | 0 |
| [style-structs.ts](../../../../packages/sfml.js-rmlui/src/gen/style-structs.ts) | CommonValues、InheritedValues、RareValues | 129 |
| [geometry.ts](../../../../packages/sfml.js-rmlui/src/geometry.ts) | GeometryReleaseMode、Geometry | 5 |
| [index.ts](../../../../packages/sfml.js-rmlui/src/index.ts) | 转导出或内部适配 | 0 |
| [input.ts](../../../../packages/sfml.js-rmlui/src/input.ts) | Touch | 0 |
| [animation-values.ts](../../../../packages/sfml.js-rmlui/src/internal/animation-values.ts) | NativeMotion | 0 |
| [computed.ts](../../../../packages/sfml.js-rmlui/src/internal/computed.ts) | FontFaceHandle | 0 |
| [element-factory.ts](../../../../packages/sfml.js-rmlui/src/internal/element-factory.ts) | 转导出或内部适配 | 0 |
| [native.ts](../../../../packages/sfml.js-rmlui/src/internal/native.ts) | NativeRmlEvent、NativeBox、NativeElementClippingRegion、NativeClipMaskGeometry、NativeRenderState、NativeNumericValue、NativeFontGlyph、NativeProperty、NativeRenderBox | 0 |
| [sfml-interop.ts](../../../../packages/sfml.js-rmlui/src/internal/sfml-interop.ts) | SfmlNativeHandle | 0 |
| [style-structs.ts](../../../../packages/sfml.js-rmlui/src/internal/style-structs.ts) | NativeFieldView、NativeStyleStruct | 0 |
| [style-values.ts](../../../../packages/sfml.js-rmlui/src/internal/style-values.ts) | NativeStyleScalar、NativeLineHeight、NativeClip、NativeStyleValue | 0 |
| [layout.ts](../../../../packages/sfml.js-rmlui/src/layout.ts) | BoxArea、ScrollAlignment、ScrollParentage、ScrollIntoViewOptions、ProjectedPoint、StylePosition、StyleFloat、StyleDisplay | 0 |
| [mesh.ts](../../../../packages/sfml.js-rmlui/src/mesh.ts) | TexturedMesh、TexturedMeshList、Mesh | 7 |
| [numeric-value.ts](../../../../packages/sfml.js-rmlui/src/numeric-value.ts) | NumericValue | 4 |
| [progress.ts](../../../../packages/sfml.js-rmlui/src/progress.ts) | ElementProgress | 4 |
| [property-definition.ts](../../../../packages/sfml.js-rmlui/src/property-definition.ts) | RelativeTarget、PropertyValueResult、PropertyDefinition | 10 |
| [property-dictionary.ts](../../../../packages/sfml.js-rmlui/src/property-dictionary.ts) | PropertyDictionary | 19 |
| [property-parser.ts](../../../../packages/sfml.js-rmlui/src/property-parser.ts) | ParameterMap、PropertyParserCallback、PropertyParser | 2 |
| [property-specification.ts](../../../../packages/sfml.js-rmlui/src/property-specification.ts) | ShorthandType、ShorthandItemOptions、PropertyShorthandItem、RecursiveShorthandItem、ShorthandDefinition、NativeShorthandDefinition、PropertySpecification | 12 |
| [property.ts](../../../../packages/sfml.js-rmlui/src/property.ts) | PropertySource、Property | 13 |
| [render-box.ts](../../../../packages/sfml.js-rmlui/src/render-box.ts) | EdgeSizes、CornerSizes、RenderBox | 13 |
| [render-manager.ts](../../../../packages/sfml.js-rmlui/src/render-manager.ts) | LayerHandle、BlendMode、RenderParameters、RenderManager | 25 |
| [render-state.ts](../../../../packages/sfml.js-rmlui/src/render-state.ts) | RenderState | 1 |
| [resources.ts](../../../../packages/sfml.js-rmlui/src/resources.ts) | RenderInterface | 7 |
| [rtti.ts](../../../../packages/sfml.js-rmlui/src/rtti.ts) | ClassIdentifier | 0 |
| [spritesheet.ts](../../../../packages/sfml.js-rmlui/src/spritesheet.ts) | SpriteRectangle、Sprite、SpriteMap、SpriteDefinitionList、Spritesheet、NativeSprite、SpritesheetList | 7 |
| [stream.ts](../../../../packages/sfml.js-rmlui/src/stream.ts) | StreamMode、SeekOrigin、StreamCallbacks、Stream、StreamMemory、StreamFile | 25 |
| [style-sheet-specification.ts](../../../../packages/sfml.js-rmlui/src/style-sheet-specification.ts) | StyleSheetSpecification | 10 |
| [style-sheet.ts](../../../../packages/sfml.js-rmlui/src/style-sheet.ts) | NamedDecorator、KeyframeBlock、Keyframes、StyleSheetContainer、StyleSheet | 14 |
| [style-values.ts](../../../../packages/sfml.js-rmlui/src/style-values.ts) | Clip | 5 |
| [tab-set.ts](../../../../packages/sfml.js-rmlui/src/tab-set.ts) | ElementTabSet | 8 |
| [text-input-handler.ts](../../../../packages/sfml.js-rmlui/src/text-input-handler.ts) | TextInputHandler | 1 |
| [texture-source.ts](../../../../packages/sfml.js-rmlui/src/texture-source.ts) | TextureSource | 4 |
| [texture.ts](../../../../packages/sfml.js-rmlui/src/texture.ts) | Texture | 4 |
| [transform.ts](../../../../packages/sfml.js-rmlui/src/transform.ts) | TransformPrimitiveType、DecomposedMatrix4、TransformPrimitive、TransformSnapshot、Transform | 9 |
| [tween.ts](../../../../packages/sfml.js-rmlui/src/tween.ts) | TweenType、TweenDirection、TweenCallback、TweenOutType、Tween | 7 |
| [types.ts](../../../../packages/sfml.js-rmlui/src/types.ts) | ContextNativeHandle、DocumentNativeHandle、ElementNativeHandle、NativeStructMapping、VariantVector2、VariantVector3、VariantVector4、VariantColour、VariantValue、VariantDefault、VariantResult、RmlEventListener | 0 |
| [unit.ts](../../../../packages/sfml.js-rmlui/src/unit.ts) | Unit、Units | 0 |
| [vertex.ts](../../../../packages/sfml.js-rmlui/src/vertex.ts) | VertexColour、Vertex | 2 |

## 全部 Native 实现、头文件与生成字段

| 文件 | 入口注册位置 | 宿主调用/转调位置 | 存储/句柄位置 | 所有权位置 | 显式 memcpy/memmove |
| --- | ---: | ---: | ---: | ---: | ---: |
| [addon.cc](../../../../packages/sfml.js-rmlui/native/addon.cc) | 0 | 0 | 0 | 0 | 0 |
| [file-interface-root.cc](../../../../packages/sfml.js-rmlui/native/file-interface-root.cc) | 0 | 0 | 0 | 0 | 0 |
| [file-interface-root.h](../../../../packages/sfml.js-rmlui/native/file-interface-root.h) | 0 | 0 | 0 | 0 | 0 |
| [render-interface-sfml.cc](../../../../packages/sfml.js-rmlui/native/render-interface-sfml.cc) | 0 | 0 | 0 | 0 | 0 |
| [render-interface-sfml.h](../../../../packages/sfml.js-rmlui/native/render-interface-sfml.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-animation-values.cc](../../../../packages/sfml.js-rmlui/native/rmlui-animation-values.cc) | 6 | 0 | 0 | 0 | 0 |
| [rmlui-animation-values.h](../../../../packages/sfml.js-rmlui/native/rmlui-animation-values.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-animation.cc](../../../../packages/sfml.js-rmlui/native/rmlui-animation.cc) | 2 | 0 | 0 | 0 | 0 |
| [rmlui-box.cc](../../../../packages/sfml.js-rmlui/native/rmlui-box.cc) | 25 | 0 | 3 | 0 | 0 |
| [rmlui-box.h](../../../../packages/sfml.js-rmlui/native/rmlui-box.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-callback-owners.cc](../../../../packages/sfml.js-rmlui/native/rmlui-callback-owners.cc) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-callback-owners.h](../../../../packages/sfml.js-rmlui/native/rmlui-callback-owners.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-callback-texture.cc](../../../../packages/sfml.js-rmlui/native/rmlui-callback-texture.cc) | 15 | 2 | 4 | 2 | 0 |
| [rmlui-callback-texture.h](../../../../packages/sfml.js-rmlui/native/rmlui-callback-texture.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-computed-fields.inc](../../../../packages/sfml.js-rmlui/native/rmlui-computed-fields.inc) | 180 | 0 | 0 | 0 | 0 |
| [rmlui-computed-values.cc](../../../../packages/sfml.js-rmlui/native/rmlui-computed-values.cc) | 6 | 0 | 2 | 0 | 0 |
| [rmlui-context-documents.cc](../../../../packages/sfml.js-rmlui/native/rmlui-context-documents.cc) | 14 | 0 | 0 | 0 | 0 |
| [rmlui-context-instancers.cc](../../../../packages/sfml.js-rmlui/native/rmlui-context-instancers.cc) | 6 | 4 | 3 | 3 | 0 |
| [rmlui-context-instancers.h](../../../../packages/sfml.js-rmlui/native/rmlui-context-instancers.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-context.cc](../../../../packages/sfml.js-rmlui/native/rmlui-context.cc) | 18 | 0 | 1 | 0 | 0 |
| [rmlui-core.cc](../../../../packages/sfml.js-rmlui/native/rmlui-core.cc) | 3 | 0 | 0 | 0 | 0 |
| [rmlui-data-address.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-address.cc) | 6 | 0 | 0 | 0 | 0 |
| [rmlui-data-address.h](../../../../packages/sfml.js-rmlui/native/rmlui-data-address.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-data-callbacks.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-callbacks.cc) | 5 | 8 | 0 | 0 | 0 |
| [rmlui-data-custom.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-custom.cc) | 0 | 1 | 0 | 0 | 0 |
| [rmlui-data-diagnostics.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-diagnostics.cc) | 5 | 0 | 0 | 0 | 0 |
| [rmlui-data-diagnostics.h](../../../../packages/sfml.js-rmlui/native/rmlui-data-diagnostics.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-data-factory.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-factory.cc) | 21 | 9 | 2 | 4 | 0 |
| [rmlui-data-factory.h](../../../../packages/sfml.js-rmlui/native/rmlui-data-factory.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-data-members.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-members.cc) | 0 | 1 | 0 | 0 | 0 |
| [rmlui-data-model.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-model.cc) | 18 | 0 | 0 | 0 | 0 |
| [rmlui-data-register.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-register.cc) | 17 | 0 | 0 | 0 | 0 |
| [rmlui-data-schema.h](../../../../packages/sfml.js-rmlui/native/rmlui-data-schema.h) | 0 | 0 | 1 | 0 | 0 |
| [rmlui-data-state.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-state.cc) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-data-storage.cc](../../../../packages/sfml.js-rmlui/native/rmlui-data-storage.cc) | 6 | 0 | 3 | 0 | 1 |
| [rmlui-data.h](../../../../packages/sfml.js-rmlui/native/rmlui-data.h) | 0 | 1 | 3 | 1 | 0 |
| [rmlui-decoration-values.cc](../../../../packages/sfml.js-rmlui/native/rmlui-decoration-values.cc) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-decoration-values.h](../../../../packages/sfml.js-rmlui/native/rmlui-decoration-values.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-decorator-callbacks.cc](../../../../packages/sfml.js-rmlui/native/rmlui-decorator-callbacks.cc) | 0 | 6 | 0 | 3 | 0 |
| [rmlui-decorator-callbacks.h](../../../../packages/sfml.js-rmlui/native/rmlui-decorator-callbacks.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-decorator.cc](../../../../packages/sfml.js-rmlui/native/rmlui-decorator.cc) | 12 | 0 | 3 | 1 | 0 |
| [rmlui-decorator.h](../../../../packages/sfml.js-rmlui/native/rmlui-decorator.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-document.cc](../../../../packages/sfml.js-rmlui/native/rmlui-document.cc) | 17 | 0 | 0 | 0 | 0 |
| [rmlui-dom.cc](../../../../packages/sfml.js-rmlui/native/rmlui-dom.cc) | 19 | 0 | 0 | 4 | 0 |
| [rmlui-effect-instancers.cc](../../../../packages/sfml.js-rmlui/native/rmlui-effect-instancers.cc) | 21 | 6 | 1 | 2 | 0 |
| [rmlui-effect-instancers.h](../../../../packages/sfml.js-rmlui/native/rmlui-effect-instancers.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-effect-values.cc](../../../../packages/sfml.js-rmlui/native/rmlui-effect-values.cc) | 4 | 0 | 1 | 1 | 0 |
| [rmlui-effect-values.h](../../../../packages/sfml.js-rmlui/native/rmlui-effect-values.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-element-access.h](../../../../packages/sfml.js-rmlui/native/rmlui-element-access.h) | 0 | 0 | 0 | 4 | 0 |
| [rmlui-element-box.cc](../../../../packages/sfml.js-rmlui/native/rmlui-element-box.cc) | 5 | 0 | 0 | 0 | 0 |
| [rmlui-element-instancers.cc](../../../../packages/sfml.js-rmlui/native/rmlui-element-instancers.cc) | 5 | 4 | 1 | 4 | 0 |
| [rmlui-element-instancers.h](../../../../packages/sfml.js-rmlui/native/rmlui-element-instancers.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-element-numeric.cc](../../../../packages/sfml.js-rmlui/native/rmlui-element-numeric.cc) | 2 | 0 | 0 | 0 | 0 |
| [rmlui-element-property.cc](../../../../packages/sfml.js-rmlui/native/rmlui-element-property.cc) | 5 | 0 | 0 | 0 | 0 |
| [rmlui-element-state.cc](../../../../packages/sfml.js-rmlui/native/rmlui-element-state.cc) | 17 | 0 | 0 | 3 | 0 |
| [rmlui-element-utilities.cc](../../../../packages/sfml.js-rmlui/native/rmlui-element-utilities.cc) | 13 | 0 | 0 | 0 | 0 |
| [rmlui-element.cc](../../../../packages/sfml.js-rmlui/native/rmlui-element.cc) | 13 | 0 | 0 | 1 | 0 |
| [rmlui-event-bridge.cc](../../../../packages/sfml.js-rmlui/native/rmlui-event-bridge.cc) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-event-bridge.h](../../../../packages/sfml.js-rmlui/native/rmlui-event-bridge.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-event-instancers.cc](../../../../packages/sfml.js-rmlui/native/rmlui-event-instancers.cc) | 7 | 4 | 1 | 3 | 0 |
| [rmlui-event-instancers.h](../../../../packages/sfml.js-rmlui/native/rmlui-event-instancers.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-events.cc](../../../../packages/sfml.js-rmlui/native/rmlui-events.cc) | 11 | 3 | 0 | 5 | 0 |
| [rmlui-events.h](../../../../packages/sfml.js-rmlui/native/rmlui-events.h) | 0 | 0 | 1 | 1 | 0 |
| [rmlui-factory.cc](../../../../packages/sfml.js-rmlui/native/rmlui-factory.cc) | 11 | 0 | 0 | 3 | 0 |
| [rmlui-filter-callbacks.cc](../../../../packages/sfml.js-rmlui/native/rmlui-filter-callbacks.cc) | 0 | 3 | 0 | 5 | 0 |
| [rmlui-filter-callbacks.h](../../../../packages/sfml.js-rmlui/native/rmlui-filter-callbacks.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-filter.cc](../../../../packages/sfml.js-rmlui/native/rmlui-filter.cc) | 3 | 0 | 1 | 1 | 0 |
| [rmlui-filter.h](../../../../packages/sfml.js-rmlui/native/rmlui-filter.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-font-effect-callbacks.cc](../../../../packages/sfml.js-rmlui/native/rmlui-font-effect-callbacks.cc) | 0 | 2 | 1 | 4 | 2 |
| [rmlui-font-effect-callbacks.h](../../../../packages/sfml.js-rmlui/native/rmlui-font-effect-callbacks.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-font-effect.cc](../../../../packages/sfml.js-rmlui/native/rmlui-font-effect.cc) | 6 | 0 | 1 | 2 | 0 |
| [rmlui-font-effect.h](../../../../packages/sfml.js-rmlui/native/rmlui-font-effect.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-font-glyph.cc](../../../../packages/sfml.js-rmlui/native/rmlui-font-glyph.cc) | 4 | 0 | 3 | 0 | 2 |
| [rmlui-font-glyph.h](../../../../packages/sfml.js-rmlui/native/rmlui-font-glyph.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-font-handle.h](../../../../packages/sfml.js-rmlui/native/rmlui-font-handle.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-fonts.cc](../../../../packages/sfml.js-rmlui/native/rmlui-fonts.cc) | 2 | 0 | 0 | 0 | 0 |
| [rmlui-forms.cc](../../../../packages/sfml.js-rmlui/native/rmlui-forms.cc) | 28 | 0 | 0 | 0 | 0 |
| [rmlui-geometry.cc](../../../../packages/sfml.js-rmlui/native/rmlui-geometry.cc) | 11 | 0 | 1 | 1 | 0 |
| [rmlui-geometry.h](../../../../packages/sfml.js-rmlui/native/rmlui-geometry.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-input.cc](../../../../packages/sfml.js-rmlui/native/rmlui-input.cc) | 14 | 0 | 0 | 0 | 1 |
| [rmlui-interop.h](../../../../packages/sfml.js-rmlui/native/rmlui-interop.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-layout.cc](../../../../packages/sfml.js-rmlui/native/rmlui-layout.cc) | 35 | 0 | 0 | 0 | 0 |
| [rmlui-listener-instancers.cc](../../../../packages/sfml.js-rmlui/native/rmlui-listener-instancers.cc) | 8 | 5 | 2 | 6 | 0 |
| [rmlui-listener-instancers.h](../../../../packages/sfml.js-rmlui/native/rmlui-listener-instancers.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-mesh.cc](../../../../packages/sfml.js-rmlui/native/rmlui-mesh.cc) | 7 | 0 | 3 | 0 | 0 |
| [rmlui-mesh.h](../../../../packages/sfml.js-rmlui/native/rmlui-mesh.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-numbers.h](../../../../packages/sfml.js-rmlui/native/rmlui-numbers.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-numeric-value.cc](../../../../packages/sfml.js-rmlui/native/rmlui-numeric-value.cc) | 4 | 0 | 3 | 0 | 0 |
| [rmlui-numeric-value.h](../../../../packages/sfml.js-rmlui/native/rmlui-numeric-value.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-panels.cc](../../../../packages/sfml.js-rmlui/native/rmlui-panels.cc) | 12 | 0 | 0 | 3 | 0 |
| [rmlui-platform-sfml.cc](../../../../packages/sfml.js-rmlui/native/rmlui-platform-sfml.cc) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-platform-sfml.h](../../../../packages/sfml.js-rmlui/native/rmlui-platform-sfml.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-property-definition.cc](../../../../packages/sfml.js-rmlui/native/rmlui-property-definition.cc) | 10 | 0 | 0 | 0 | 0 |
| [rmlui-property-dictionary.cc](../../../../packages/sfml.js-rmlui/native/rmlui-property-dictionary.cc) | 19 | 0 | 1 | 1 | 0 |
| [rmlui-property-dictionary.h](../../../../packages/sfml.js-rmlui/native/rmlui-property-dictionary.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-property-parser.cc](../../../../packages/sfml.js-rmlui/native/rmlui-property-parser.cc) | 4 | 2 | 1 | 1 | 0 |
| [rmlui-property-parser.h](../../../../packages/sfml.js-rmlui/native/rmlui-property-parser.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-property-specification.cc](../../../../packages/sfml.js-rmlui/native/rmlui-property-specification.cc) | 20 | 0 | 1 | 1 | 0 |
| [rmlui-property-specification.h](../../../../packages/sfml.js-rmlui/native/rmlui-property-specification.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-property.cc](../../../../packages/sfml.js-rmlui/native/rmlui-property.cc) | 13 | 0 | 1 | 2 | 0 |
| [rmlui-property.h](../../../../packages/sfml.js-rmlui/native/rmlui-property.h) | 0 | 0 | 2 | 0 | 0 |
| [rmlui-render-layers.cc](../../../../packages/sfml.js-rmlui/native/rmlui-render-layers.cc) | 6 | 0 | 1 | 2 | 0 |
| [rmlui-render-layers.h](../../../../packages/sfml.js-rmlui/native/rmlui-render-layers.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-render-manager.cc](../../../../packages/sfml.js-rmlui/native/rmlui-render-manager.cc) | 15 | 0 | 3 | 3 | 0 |
| [rmlui-render-manager.h](../../../../packages/sfml.js-rmlui/native/rmlui-render-manager.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-render-state.cc](../../../../packages/sfml.js-rmlui/native/rmlui-render-state.cc) | 14 | 0 | 1 | 0 | 2 |
| [rmlui-render-state.h](../../../../packages/sfml.js-rmlui/native/rmlui-render-state.h) | 1 | 0 | 0 | 0 | 0 |
| [rmlui-resources.cc](../../../../packages/sfml.js-rmlui/native/rmlui-resources.cc) | 8 | 0 | 0 | 0 | 0 |
| [rmlui-resources.h](../../../../packages/sfml.js-rmlui/native/rmlui-resources.h) | 0 | 0 | 1 | 0 | 0 |
| [rmlui-rtti.cc](../../../../packages/sfml.js-rmlui/native/rmlui-rtti.cc) | 3 | 0 | 0 | 0 | 0 |
| [rmlui-select.cc](../../../../packages/sfml.js-rmlui/native/rmlui-select.cc) | 12 | 0 | 0 | 4 | 0 |
| [rmlui-shaders.h](../../../../packages/sfml.js-rmlui/native/rmlui-shaders.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-spritesheet.cc](../../../../packages/sfml.js-rmlui/native/rmlui-spritesheet.cc) | 7 | 0 | 1 | 0 | 0 |
| [rmlui-spritesheet.h](../../../../packages/sfml.js-rmlui/native/rmlui-spritesheet.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-state.cc](../../../../packages/sfml.js-rmlui/native/rmlui-state.cc) | 0 | 1 | 0 | 17 | 0 |
| [rmlui-state.h](../../../../packages/sfml.js-rmlui/native/rmlui-state.h) | 3 | 1 | 2 | 2 | 0 |
| [rmlui-stream-callbacks.cc](../../../../packages/sfml.js-rmlui/native/rmlui-stream-callbacks.cc) | 0 | 2 | 2 | 0 | 2 |
| [rmlui-stream-callbacks.h](../../../../packages/sfml.js-rmlui/native/rmlui-stream-callbacks.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-stream.cc](../../../../packages/sfml.js-rmlui/native/rmlui-stream.cc) | 18 | 0 | 2 | 1 | 4 |
| [rmlui-stream.h](../../../../packages/sfml.js-rmlui/native/rmlui-stream.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-style-enums.inc](../../../../packages/sfml.js-rmlui/native/rmlui-style-enums.inc) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-style-sheet.cc](../../../../packages/sfml.js-rmlui/native/rmlui-style-sheet.cc) | 22 | 0 | 3 | 1 | 0 |
| [rmlui-style-sheet.h](../../../../packages/sfml.js-rmlui/native/rmlui-style-sheet.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-style-struct-bindings.inc](../../../../packages/sfml.js-rmlui/native/rmlui-style-struct-bindings.inc) | 129 | 0 | 0 | 0 | 0 |
| [rmlui-style-struct-fields.inc](../../../../packages/sfml.js-rmlui/native/rmlui-style-struct-fields.inc) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-style-structs.cc](../../../../packages/sfml.js-rmlui/native/rmlui-style-structs.cc) | 0 | 0 | 2 | 0 | 0 |
| [rmlui-style-values.cc](../../../../packages/sfml.js-rmlui/native/rmlui-style-values.cc) | 10 | 0 | 4 | 0 | 0 |
| [rmlui-style-values.h](../../../../packages/sfml.js-rmlui/native/rmlui-style-values.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-text.cc](../../../../packages/sfml.js-rmlui/native/rmlui-text.cc) | 7 | 0 | 0 | 0 | 0 |
| [rmlui-texture-source.cc](../../../../packages/sfml.js-rmlui/native/rmlui-texture-source.cc) | 4 | 0 | 1 | 2 | 0 |
| [rmlui-texture-source.h](../../../../packages/sfml.js-rmlui/native/rmlui-texture-source.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-transform-values.cc](../../../../packages/sfml.js-rmlui/native/rmlui-transform-values.cc) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-transform.cc](../../../../packages/sfml.js-rmlui/native/rmlui-transform.cc) | 9 | 0 | 1 | 0 | 0 |
| [rmlui-transform.h](../../../../packages/sfml.js-rmlui/native/rmlui-transform.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-tween.cc](../../../../packages/sfml.js-rmlui/native/rmlui-tween.cc) | 7 | 2 | 1 | 3 | 0 |
| [rmlui-tween.h](../../../../packages/sfml.js-rmlui/native/rmlui-tween.h) | 0 | 0 | 0 | 1 | 0 |
| [rmlui-value-callbacks.cc](../../../../packages/sfml.js-rmlui/native/rmlui-value-callbacks.cc) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-value-callbacks.h](../../../../packages/sfml.js-rmlui/native/rmlui-value-callbacks.h) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-variant.cc](../../../../packages/sfml.js-rmlui/native/rmlui-variant.cc) | 0 | 0 | 0 | 0 | 0 |
| [rmlui-variant.h](../../../../packages/sfml.js-rmlui/native/rmlui-variant.h) | 0 | 0 | 0 | 0 | 0 |
| [system-interface-sfml.cc](../../../../packages/sfml.js-rmlui/native/system-interface-sfml.cc) | 0 | 0 | 0 | 0 | 0 |
| [system-interface-sfml.h](../../../../packages/sfml.js-rmlui/native/system-interface-sfml.h) | 0 | 0 | 0 | 0 | 0 |
| [window-density-macos.mm](../../../../packages/sfml.js-rmlui/native/window-density-macos.mm) | 0 | 0 | 0 | 0 | 0 |
| [window-density.cc](../../../../packages/sfml.js-rmlui/native/window-density.cc) | 0 | 0 | 0 | 0 | 0 |
| [window-density.h](../../../../packages/sfml.js-rmlui/native/window-density.h) | 0 | 0 | 0 | 0 | 0 |

## 实际导出对账

顶层 TypeScript 导出 271 个；
已加载 Addon 导出 988 个属性。
全部直接 native 方法调用名称均存在于加载的 Addon 导出中。
此检查不证明重载参数、行为语义、性能或 6.3 原生声明覆盖完整。
