#include "exception-boundary.h"
#include "value-binding.h"

NAN_MODULE_INIT(InitializeValues) {
  sfmljs::SetMethod<sfmljs::values::AngleValues::Create>(target, "createAngle");
  sfmljs::SetMethod<sfmljs::values::AngleValues::Wrap>(target, "wrapAngle");
  sfmljs::SetMethod<sfmljs::values::TransformValues::Create>(target,
                                                             "createTransform");
  sfmljs::SetMethod<sfmljs::values::TransformValues::Wrap>(target,
                                                           "wrapTransform");
  sfmljs::SetMethod<sfmljs::values::Mat3Values::Wrap>(target, "wrapMat3");
  sfmljs::SetMethod<sfmljs::values::Mat4Values::Wrap>(target, "wrapMat4");
  sfmljs::SetMethod<sfmljs::values::Vector2Values::Create>(target,
                                                           "createVector2");
  sfmljs::SetMethod<sfmljs::values::Vector2Values::Wrap>(target, "wrapVector2");
  sfmljs::SetMethod<sfmljs::values::Vector3Values::Create>(target,
                                                           "createVector3");
  sfmljs::SetMethod<sfmljs::values::Vector3Values::Wrap>(target, "wrapVector3");
  sfmljs::SetMethod<sfmljs::values::Vector4Values::Create>(target,
                                                           "createVector4");
  sfmljs::SetMethod<sfmljs::values::Vector4Values::Wrap>(target, "wrapVector4");
  sfmljs::SetMethod<sfmljs::values::ColorValues::Create>(target, "createColor");
  sfmljs::SetMethod<sfmljs::values::ColorValues::Wrap>(target, "wrapColor");
  sfmljs::SetMethod<sfmljs::values::RectValues::Create>(target, "createRect");
  sfmljs::SetMethod<sfmljs::values::RectValues::Wrap>(target, "wrapRect");
  sfmljs::SetMethod<sfmljs::values::Member<sfmljs::values::RectValues>>(
      target, "rectMember");
  sfmljs::SetMethod<sfmljs::values::VertexValues::Create>(target,
                                                          "createVertex");
  sfmljs::SetMethod<sfmljs::values::VertexValues::Wrap>(target, "wrapVertex");
  sfmljs::SetMethod<sfmljs::values::Member<sfmljs::values::VertexValues>>(
      target, "vertexMember");
}
