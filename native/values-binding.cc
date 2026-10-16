#include "value-binding.h"
#include "exception-boundary.h"

NAN_MODULE_INIT(InitializeValues) {
  using namespace sfmljs::values;

  sfmljs::SetMethod<AngleValues::Create>(target, "createAngle");
  sfmljs::SetMethod<AngleValues::Wrap>(target, "wrapAngle");
  sfmljs::SetMethod<TransformValues::Create>(target, "createTransform");
  sfmljs::SetMethod<TransformValues::Wrap>(target, "wrapTransform");
  sfmljs::SetMethod<Mat3Values::Wrap>(target, "wrapMat3");
  sfmljs::SetMethod<Mat4Values::Wrap>(target, "wrapMat4");
  sfmljs::SetMethod<Vector2Values::Create>(target, "createVector2");
  sfmljs::SetMethod<Vector2Values::Wrap>(target, "wrapVector2");
  sfmljs::SetMethod<Vector3Values::Create>(target, "createVector3");
  sfmljs::SetMethod<Vector3Values::Wrap>(target, "wrapVector3");
  sfmljs::SetMethod<Vector4Values::Create>(target, "createVector4");
  sfmljs::SetMethod<Vector4Values::Wrap>(target, "wrapVector4");
  sfmljs::SetMethod<ColorValues::Create>(target, "createColor");
  sfmljs::SetMethod<ColorValues::Wrap>(target, "wrapColor");
  sfmljs::SetMethod<RectValues::Create>(target, "createRect");
  sfmljs::SetMethod<RectValues::Wrap>(target, "wrapRect");
  sfmljs::SetMethod<Member<RectValues>>(target, "rectMember");
  sfmljs::SetMethod<VertexValues::Create>(target, "createVertex");
  sfmljs::SetMethod<VertexValues::Wrap>(target, "wrapVertex");
  sfmljs::SetMethod<Member<VertexValues>>(target, "vertexMember");
}
