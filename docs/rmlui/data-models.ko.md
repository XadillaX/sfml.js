# 네이티브 데이터 모델

RmlUi는 네이티브 Core에서 표현식을 계산하고 변경된 뷰를 업데이트하며 양방향 컨트롤러를 실행합니다. `data-model` 속성을 사용하는 문서를 로드하기 전에 같은 이름의 모델을 생성합니다.

```js
const model = context.createDataModel('application');

if (!model) {
  throw new Error('Duplicate model');
}

model.bind('title', 'Inventory');
model.bind('count', 1);
const handle = model.getModelHandle();

const document = context.loadDocumentFromMemory(`
  <rml><head/><body data-model="application">
    <div>{{title}}: {{count}}</div>
  </body></rml>
`);

document.show();

model.getVariable('$.count').set(2);
handle.dirtyVariable('count');
context.update();
```

`DataModelConstructor`는 값과 콜백을 바인딩합니다. `getModelHandle()`은 루트 변수 변경 예약을 위한 별도의 `DataModelHandle`을 반환합니다. `getDataModel(name)`은 같은 생성자를 반환하고 `getDataModels()`는 스냅샷을 반환합니다. 중복 이름이나 없는 모델은 `null`을 반환합니다. `removeDataModel(name)`은 네이티브 불리언 결과를 반환합니다.

스칼라 저장소는 네이티브가 소유합니다. 초기 boolean, number, BigInt, string 값이 네이티브 유형을 결정합니다. `DataVariable.get()`과 `set(value)`는 실제 정의를 호출하고 문자열에서 숫자로 변환하는 `atof` 동작을 포함한 RmlUi 변환 규칙을 따릅니다. 쓰기만으로 루트를 변경 표시하지 않습니다. 변수 핸들은 경로를 저장하고 호출마다 저장소를 다시 찾습니다.

`new DataModelHandle()`, `new DataModelConstructor()`, `new DataVariable()`는 무효한 핸들을 생성합니다. `isValid`는 `false`를 반환하며 유효한 값이 필요한 작업은 예외를 던집니다. 모델 변수의 유효성은 배열 자르기를 포함한 현재 경로도 검사합니다.

`new DataVariable(schema, initialValue)`는 검증된 등록 `DataSchema`로 독립적인
네이티브 소유 저장소를 생성합니다. 초기값을 생략하면 기본값을 사용합니다. 스칼라, 열거형,
배열, 재귀 구조, 관리되는 참조와 사용자 데이터는 모델과 같은 정의를 사용합니다.
자식 변수는 루트를 유지하고 크기나 참조가 변경되면 경로를 다시 찾습니다. 숫자 뷰는 네이티브
메모리를 공유하며 이전 뷰는 크기 변경이나 종료 후에도 원래 할당을 유지합니다. 변수는
레지스터를 유지하며 레지스터와 함께 무효화됩니다. 참조와 콜백 대상은 같은 레지스터를 사용해야
합니다. 데이터와 참조는 V8에서 보이는 소유 관계를 사용하므로 도달할 수 없는 순환은 GC로
수거됩니다. `model.bindCustomDataVariable(name, variable)`는 검증된 별칭을 바인딩합니다.
모델을 업데이트하려면 루트 변경을 명시적으로 표시해야 합니다.

```js
const { DataTypeRegister, DataVariable } = require('sfml.js-rmlui');
const types = new DataTypeRegister();
const real = types.registerScalar('Real', 'float64');
const reals = types.registerArray('Reals', real);
const values = new DataVariable(reals, [1, 2]);

values.getNumericView()[1] = 3;
const ownedModel = context.createDataModel('owned', {typeRegister: types});

ownedModel.bindCustomDataVariable('values', values);
ownedModel.dirtyVariable('values');
```

`DataTypeGetFunc<T>`와 `DataTypeSetFunc<T>`는 스칼라 데이터 콜백 유형입니다. `DataEventMemberFunc<T>`, `MemberGetFunc<T>`, `MemberSetFunc<T>`는 호스트 메서드를 나타내며 `.bind(owner)`로 수신자를 바인딩한 뒤 `bindEventCallback()` 또는 `bindFunc()`에 전달합니다. `MemberGetterFunc<Object, ReturnType>`와 `MemberSetterFunc<Object, AssignType>`는 `registerMember()`에서 사용하는 값 또는 참조 메서드 유형입니다. `VoidMemberFunc`는 생략한 멤버 콜백인 `undefined`로 표현합니다.

`DataAddressEntry(nameOrIndex)`의 `name`과 `index` 필드는 변경할 수 있습니다. 이름으로 생성하면 인덱스는 `-1`, 인덱스로 생성하면 이름은 `''`입니다. 순서 있는 `DataAddress`를 `getVariable()`에, 개별 항목을 `child()`에 전달합니다. 조회할 때 두 필드를 복사하므로 나중에 항목을 수정해도 저장한 변수의 대상은 바뀌지 않습니다. 명시적 항목은 점이 포함된 멤버 이름도 지원합니다.

```js
const { DataAddressEntry, makeLiteralIntVariable } = require('sfml.js-rmlui');
const count = model.getVariable([new DataAddressEntry('count')]);

model.bindCustomDataVariable('constant', makeLiteralIntVariable(-7));
const roots = model.getAllVariables();
// roots.count resolves the same live storage; later bound roots are absent.
```

`makeLiteralIntVariable(value)`는 0과 음수를 포함하는 부호 있는 32비트 정수를 받아 Core의 불변 리터럴을 생성합니다. 읽기는 성공하고 쓰기는 `false`, 크기는 0이며 자식은 없습니다. 독립 리터럴은 모델 제거 및 런타임 종료 후에도 유효하며 모델에서 조회한 변수는 모델 수명을 따릅니다. `getAllVariables()`는 `DataModelConstructorAccessor`로 네이티브 루트 이름의 스냅샷을 조회합니다.

`DataVariable.getDefinition()`은 `DataVariableAccessor`로 검증된 `DataDefinition`을 반환합니다. 등록된 정의는 정규 `DataSchema`의 동일성을 유지하며 추론 스칼라, 함수 바인딩 및 리터럴은 변수 수명 핸들을 유지합니다. `isValid`, `type`, `reflectMemberNames()`는 매번 소유자를 검증합니다. 독립 리터럴 정의는 런타임 종료 후에도 유효합니다. 모델에서 얻은 정의는 모델이나 변수 경로가 만료되면 무효화됩니다.

`DataSchema.underlying`은 정규 배열 요소 또는 관리되는 참조 대상 스키마를 반환하며 나머지는 `null`입니다. `DataPointerTraits(schema)`는 `isPointer`, `elementType`, `dereference(variable)`로 `PointerTraits::is_pointer_v`, `element_type`, `Dereference`의 런타임 대응 기능을 제공합니다. 값은 래퍼 동일성을 유지하고 참조는 검증된 대상 또는 `null`을 반환합니다. 정의 불일치와 만료된 핸들은 거부합니다. C++ 원시, 고유 및 공유 포인터는 JS에서 관리되는 네이티브 참조 수명 핸들을 사용하며 주소는 경계를 넘지 않습니다.

`DataTypeRegister.createFamilyId()`는 실제 네이티브 식별자를 할당합니다. `registerDefinition(familyId, name, callbacks)`는 사용자 정의를 네이티브 레지스터로 이전하고 삽입 결과를 반환합니다. 식별자나 이름이 중복되면 `false`를 반환하며 거부된 콜백을 유지하지 않습니다. 같은 런타임 세대에서 레지스터 간 식별자를 재사용할 수 있습니다. 임의 숫자와 이전 세대 식별자는 거부됩니다. `getDefinition(nameOrFamilyId)`는 정규 등록 스키마 또는 `null`을 반환합니다.

`new DataStructHandle(register, definition)`은 기존 등록 구조 정의를 감싸며
정의와 레지스터 수명 핸들을 공유하고 데이터 저장소를 할당하지 않습니다. 다른 레지스터,
스칼라, 배열, 참조, 사용자 정의 및 만료된 레지스터는 거부합니다.

네이티브 `ScalarDefinition`, `ScalarFuncDefinition`, `StructDefinition`,
`ArrayDefinition<Container>`는 스칼라, 콜백, 구조 및 배열 스키마에 대응합니다.
`StructHandle::RegisterMember`는 멤버 객체를 저장 멤버로, 스칼라 getter를 값 콜백으로,
포인터와 참조 getter를 검증된 변수 콜백으로 매핑합니다. getter/setter 쌍은 void
setter 호출 전에 네이티브 스칼라 변환을 수행합니다. 생략한 콜백은 `VoidMemberFunc`입니다.
사용자 `VariableDefinition`은 `DataCustomDefinition` 콜백으로 표현하며 네이티브
레지스터가 어댑터를 소유하고 각 노드가 데이터를 유지합니다. JS는 네이티브 저장소와
검증된 수명 핸들을 사용하며 C++ 주소를 받지 않습니다. 네이티브 코드는 상위 헤더에서
C++ 템플릿을 인스턴스화할 수 있습니다.

유효한 대상에서는 관리되는 참조가 네이티브 Get/Set/Size/Child 및 리플렉션을 전달합니다.
상위 `BasePointerDefinition`은 바깥 저장 주소를 확인하지만 null 참조 대상을 보호하지
않습니다. JS는 대상도 검증하고 문서화된 빈 동작으로 null을 처리합니다. 숫자 범위 확인,
스키마 고정 및 중복 멤버 거부는 JS 검증 정책이며 동일한 C++ 메모리 배치를 의미하지 않습니다.

```js
let name = 'initial';

model.bindFunc('name', () => name, value => {
  name = String(value);
});
model.registerTransformFunc('decorate', args =>
  `${args[1]}${args[0]}${args[1]}`);
model.bindEventCallback('increment', (handle, event, args) => {
  const count = model.getVariable('count');

  count.set(Number(count.get()) + Number(args[0]));
  handle.dirtyVariable('count');
  event.stopPropagation();
});
```

표현식 문자열에는 작은따옴표를 사용합니다. 예를 들어 `{{name | decorate('!')}}` 또는 `data-event-click="increment(3)"`을 사용합니다. `bindFunc`에서 setter를 생략하면 읽기 전용입니다. 네이티브 `data-value` 컨트롤러는 setter를 호출하고 루트 변경을 표시합니다. 변환 함수는 컨텍스트 유형 레지스트리에 속하므로 등록한 모델을 제거해도 유지됩니다. 중복 이름이면 첫 등록을 유지하고 거부한 호스트 콜백을 유지하지 않습니다. 내장 변환도 같은 규칙을 따릅니다.

`model.update(clearDirtyVariables = true)`는 네이티브 `DataModel::Update`를 실행합니다. `Context.update()`도 모델을 업데이트합니다. 문서를 로드하거나 표시할 때 뷰를 동기 업데이트하여 getter를 호출할 수 있습니다.

콜백은 소유 Node 환경에서 동기 실행되며 첫 번째 예외를 호스트 경계로 반환합니다. 같은 getter의 재귀 호출은 거부합니다. 콜백 중에 모델, 컨텍스트 또는 런타임을 제거할 수 없습니다. 이벤트 연산은 데이터 콜백 반환 후 만료되지만 저장된 필드는 읽을 수 있습니다. 모델 제거는 관련 모델과 변수 핸들을 모두 무효화합니다. 컨텍스트 파괴와 종료는 관련 모델을 무효화합니다. 네이티브 소유 컨텍스트는 콜백을 유지하고 독립 소유 컨텍스트는 V8에 보이는 소유 관계를 통해 콜백 순환을 수거할 수 있습니다.

컨텍스트 기본 레지스터를 사용하거나 독립된 `DataTypeRegister`를 생성하여 `createDataModel(name, { typeRegister })`에 전달합니다. 독립 레지스터는 여러 컨텍스트에서 공유하며 컨텍스트 제거 후에도 유지됩니다. 기본 레지스터는 모델 제거 후 유지되고 컨텍스트 파괴 시 무효화됩니다. 종료하면 모든 레지스터가 무효화됩니다.

```js
const types = model.getDataTypeRegister();
const number = types.registerScalar('Real', 'float64');
const text = types.registerScalar('Text', 'string');
const item = types.registerStruct('Item');

item.registerMember('name', text);
item.registerMember('price', number);
const items = types.registerArray('Items', item);

model.bind('items', [{ name: 'Apple', price: 2.5 }], items);
model.applyPatch({ '$.items[0].price': 3 });
context.update();
```

스칼라 스키마는 `bool`, `string`, `int8`/`uint8`, `int16`/`uint16`, `int32`/`uint32`, `int64`/`uint64`, `float32`, `float64`를 지원합니다. 정수 변환은 대상 범위를 검사하고 거부된 쓰기는 이전 값을 유지합니다. 네이티브 양방향 컨트롤러에도 같은 검사를 적용합니다. 구조체 멤버는 자체 구조체의 배열을 참조할 수 있습니다. 저장소 생성을 시작하면 스키마가 고정됩니다. 중복 유형 이름은 `null`, 중복 멤버는 `false`를 반환합니다. 서로 다른 레지스터의 정의를 혼용할 수 없습니다.

`bindFunc` getter와 변환 콜백은 null, 기본값, 벡터, 색상, 장식 목록, 변환 스냅샷, 애니메이션과 전환 목록, 타입이 있는 효과 목록을 포함하는 소유 `DataVariantValue`를 반환할 수 있습니다. 정의가 지원하면 `DataVariable.set()`도 같은 값을 받습니다. 변환은 값을 복사하고 네이티브 공유 리소스를 유지합니다. 빌린 요소와 void 포인터에는 관리 참조 정의가 필요합니다. 반환값 접근자도 활성 콜백 안에서 실행되며 재귀와 제거 검사를 적용합니다.

```js
model.bindFunc('accent', () => ({
  type: 'colourb', red: 165, green: 213, blue: 205, alpha: 255,
}));
const transforms = types.getTransformFuncRegister();

transforms.register('coordinates', args => ({
  x: Number(args[0]), y: Number(args[1]),
}));
const result = transforms.call('coordinates', [ 3, 4 ]);
// { success: true, value: { x: 3, y: 4 } }
```

`TransformFuncRegister`는 내장 함수와 모델 등록 함수를 포함하는 실제 네이티브 레지스터를 호출합니다. `success`는 없는 함수와 null을 반환하는 함수를 구분합니다. 없는 함수는 `{ success: false, value: null }`을 반환합니다. 래퍼는 소유 유형 레지스터 수명 핸들을 유지하며 같은 수명을 사용합니다. 입력 변환을 마친 뒤 이 수명 핸들을 검증합니다.

숫자 배열은 `variable.getNumericView()`로 스키마에 맞는 공유 타입 뷰를 제공합니다. 불리언과 문자열 배열은 검증된 자식 연산을 사용합니다. `variable.resize(count)`는 기존 요소를 유지하고 새 요소를 네이티브 기본값으로 초기화하며 루트 변경을 자동 표시하지 않습니다. 크기 변경 후 새 숫자 뷰를 가져옵니다. 이전 뷰는 원래 메모리를 유지하고 새 배열을 수정하지 않습니다. 뷰는 모델이나 컨텍스트를 유지하지 않으며 이 객체가 파괴된 뒤에도 메모리를 사용할 수 있습니다. 네이티브 표현식, 뷰, 컨트롤러와 JS 핸들은 호출마다 경로를 다시 찾습니다.

`applyPatch`는 쓰기 전에 지정된 스칼라 값만 변환하고 성공한 설정의 루트만 표시하며 네이티브 데이터 이벤트 콜백에서도 사용할 수 있습니다. 등록되지 않은 속성은 읽지 않습니다. 변환 getter 예외는 부분 쓰기를 일으키지 않습니다. 첫 번째 예외는 후속 설정을 중단하고 거부된 쓰기는 `false`를 반환합니다. 유형 등록은 콜백 외부에서 실행합니다. 배열 `.size`, 인덱스 자식, 이름 자식과 멤버 리플렉션은 네이티브 정의를 사용합니다.

데이터 이벤트 함수에서 등록된 배열 크기를 동기적으로 바꾸면 같은 이벤트 표현식의 후속 문장이 즉시 새 크기를 읽습니다. getter, setter, 변환, 사용자 정의, 멤버 콜백과 중첩된 일반 리스너에서는 금지합니다. getter가 데이터 이벤트를 발생시켜도 제한은 유지됩니다. 변경 후 원본 루트를 표시하고 애플리케이션으로 돌아온 뒤 뷰를 갱신합니다.

공식 `data-binding`은 상류의 네 모델을 실행하며 마우스 위치 기록, 주제 추가와 삭제, 양방향 컨트롤 및 Invaders 시뮬레이션을 포함합니다. `tree-view`는 실제 예제 디렉터리를 읽고 상류의 하위 항목 표시 및 접기 규칙을 따릅니다. 원본 리소스를 직접 로드합니다:

```sh
node packages/sfml.js-rmlui/examples/official.cjs data-binding
node packages/sfml.js-rmlui/examples/official.cjs tree-view
```

상류 폼에는 `onsubmit="submit_form"`이 있지만 애플리케이션은 대응 핸들러를 설치하지 않습니다. 이 동작을 유지하며 `ElementForm.submit()`은 실제 네이티브 제출 이벤트를 발생시킵니다.

`registerReference(name, targetSchema)`는 null 허용 관리 모델 참조를 등록합니다. 스칼라, 배열 및 구조체 대상은 같은 레지스터의 기반 정의와 일치해야 합니다. `DataVariable` 또는 `null`을 바인딩하며 구조체 멤버와 배열 요소에도 사용할 수 있습니다. 참조의 참조는 포인터를 가리키는 포인터를 금지하는 RmlUi 6.3 `DataTypeRegister::GetDefinition<T>()`의 `static_assert`와 같이 거부합니다. 재귀 구조체 멤버와 참조 배열은 지원합니다.

```js
const itemRef = types.registerReference('ItemRef', item);

model.bind('selected', model.getVariable('items[0]'), itemRef);
model.getVariable('selected.price').set(4);
model.dirtyVariable('items');
model.dirtyVariable('selected');
const selected = model.getVariable('selected');

selected.setReference(null);
model.dirtyVariable('selected');
// selected.getReference() === null
```

`getReference()`는 검증된 대상을 반환하며 `setReference(target)`는 루트를 표시하지 않고 대상을 교체하거나 지웁니다. 빈 스칼라 참조는 null을 읽고 쓰기는 `false`를 반환합니다. 빈 배열 참조의 크기는 0이며 빈 참조에는 자식이 없습니다. 제거된 모델과 무효 배열 경로는 예외를 던지고 자기 의존 경로는 재귀 깊이 제한을 따릅니다. 네이티브 저장소는 약한 경로를 보관하며 V8에 보이는 연결이 대상을 유지합니다. 지우기, 배열 자르기, 모델 제거로 연결을 해제하며 소유 컨텍스트 사이의 참조 순환도 수거합니다. 숫자 뷰와 크기 변경은 현재 대상을 사용합니다.

`registerEnum(name, integerKind)`는 검증된 기반 정수 너비로 네이티브 열거형 값을 저장합니다. 전체 여덟 종류의 부호 있는 정수와 부호 없는 정수, 완전한 `uint64` 범위를 지원하며 숫자 배열 뷰도 기반 너비를 사용합니다. 이름 있는 열거 값 집합은 제한하지 않습니다. 생성자는 자신의 네이티브 유형 레지스터를 사용하는 `registerScalar`, `registerStruct`, `registerArray`, `registerCustomDataVariableDefinition`도 제공합니다.

```js
const { DataVariableType } = require('sfml.js-rmlui');
const status = model.registerEnum('Status', 'uint8');

model.bind('status', 2, status);
const custom = model.registerCustomDataVariableDefinition('Price', {
  type: DataVariableType.Scalar,
  get: payload => ({ success: true, value: payload.price }),
  set: (payload, value) => {
    if (typeof value !== 'number') {
      return false;
    }

    payload.price = value;

    return true;
  },
});

model.bindCustomDataVariable('price', { price: 3 }, custom);
model.getVariable('price').set(4);
```

사용자 정의 정의는 실제 네이티브 `VariableDefinition::Get`, `Set`, `Size`, `Child`, `ReflectMemberNames`를 구현합니다. `get(payload)`는 `{ success, value }`를 반환하며 성공할 때만 소유 Variant 값을 읽습니다. `set(payload, value)`는 불리언, `size(payload)`는 음수가 아닌 네이티브 int를 반환합니다. `child(payload, nameOrIndex)`는 같은 레지스터의 검증된 `DataVariable` 또는 `null`, `reflectMemberNames()`는 유형 수준 이름을 반환합니다. 생략된 메서드는 네이티브 기본값을 사용하며 배열 `"size"` 자식은 child 콜백이 제공합니다.

`bindCustomDataVariable(name, payload, schema)`는 원본 JS 데이터를 직렬화 없이 유지하고 `getPayload()`는 같은 객체를 반환합니다. 반환값 접근자도 활성 콜백 안에서 실행하며 재귀, 파괴적 작업과 첫 예외는 기존 검사를 따릅니다. 자식 변수 수명 핸들은 후속 콜백을 포함하여 가장 바깥쪽 네이티브 호출이 끝날 때까지 유지됩니다. 숫자 뷰와 크기 변경은 사용자 정의 자식 경로를 따라 등록된 네이티브 배열에 도달합니다. 사용자 정의 배열 자체는 크기 변경 저장소를 제공하지 않습니다. 실패한 바인딩은 데이터를 유지하지 않으며 모델 제거 시 해제되고 소유 컨텍스트 순환도 수거됩니다.

`registerMember(name, schema, getter?, setter?)`는 네이티브 멤버 접근자를 등록합니다. 콜백은 배열 확장으로 추가된 요소를 포함하여 현재 부모 경로의 검증된 `DataVariable`을 받습니다. 접근자 멤버의 초기 속성은 읽거나 유지하지 않습니다. 일반 스칼라와 열거형은 선언한 너비로 변환한 뒤 setter를 호출하고, 사용자 스칼라 멤버는 소유 Variant를 직접 교환합니다. setter를 생략하면 읽기 전용이고 getter를 `undefined`로 전달하면 쓰기 전용입니다.

```js
const accessorTypes = new rmlui.DataTypeRegister();
const real = accessorTypes.registerScalar('Real', 'float64');
const product = accessorTypes.registerStruct('Product');

product.registerMember('price', real);
product.registerMember('doublePrice', real,
  parent => Number(parent.child('price').get()) * 2,
  (parent, value) => parent.child('price').set(Number(value) / 2));
```

저장소 바인딩 전에 멤버를 등록합니다. 배열이나 구조 getter는 같은 레지스터의 정확히 같은 정의를 가진 변수 또는 `null`을 반환합니다. 스칼라 참조 getter는 참조 스키마를 사용합니다. 참조 getter는 읽기, 쓰기, 자식 경로, 숫자 뷰 및 크기 변경을 현재 대상으로 전달하며 값 setter는 받지 않습니다. null은 관리 참조의 의미를 따릅니다. 반환한 수명 핸들은 전체 네이티브 호출이 끝날 때까지 유지되고 저장한 부모와 자식 변수는 크기 변경이나 모델 삭제 후 경로를 다시 확인합니다.

`registerScalar(name, { get?, set? })`는 유지되는 데이터의 스칼라 유형 콜백을 등록합니다. getter는 소유 Variant를 직접 반환하고 setter는 네이티브 `void` 의미를 사용합니다. 열거형에서 라벨로 매핑할 때 사용할 수 있습니다.

```js
const label = model.registerScalar('StatusLabel', {
  get: data => ['idle', 'ready', 'done'][data.code],
  set: (data, value) => {
    data.code = ['idle', 'ready', 'done'].indexOf(String(value));
  },
});

model.bindCustomDataVariable('statusLabel', { code: 1 }, label);
model.bindCustomDataVariable('countAlias', model.getVariable('count'));
```

두 인수 `bindCustomDataVariable(name, variable)`는 고급 별칭을 등록합니다. 같은 레지스터의 검증된 대상을 유지하고 배열 크기 변경과 추론 정수 범위 검사를 포함해 매번 경로를 다시 확인합니다. 공개 유형 이름은 추가하지 않습니다. 대상 삭제나 배열 축소 후 접근은 무효가 되며 모델 삭제 시 대상 소유 관계를 해제합니다. 쓰기 후에는 뷰가 사용하는 원본과 별칭 루트에 각각 변경 표시를 합니다. 거부된 등록과 중복 별칭은 콜백이나 대상을 유지하지 않습니다.

`DataView`와 `DataController`는 실제 네이티브 가상 작업을 구현합니다. 유효한 요소에 생성하고 `DataViewInstancer` 또는 `DataControllerInstancer`에서 반환합니다. `initialize(model, element, expression, modifier)`는 실제 모델의 검증된 `DataModelConstructor`를 받고 불리언을 반환합니다. 뷰의 `update(model)`는 문서 변경 여부를 반환하며 `getVariableNameList()`는 Core 네이티브 스케줄러에 루트 의존성을 제공합니다.

```js
const { Factory, DataView, DataViewInstancer } = require('sfml.js-rmlui');

Factory.registerDataViewInstancer(new DataViewInstancer(element => {
  let name = '';

  return new DataView(element, {
    initialize(_model, _element, expression) {
      name = expression;

      return true;
    },
    update(current) {
      const label = String(current.getVariable(name).get());

      if (element.getAttribute('title') === label) {
        return false;
      }

      element.setAttribute('title', label);

      return true;
    },
    getVariableNameList: () => [name],
  }, -10);
}), 'label');
// <span data-label="count">현재 수를 호버로 표시</span>
```

`Factory.registerDataViewInstancer(instancer, name, structural = false)`와 `registerDataControllerInstancer(instancer, name)`는 실제 등록 작업을 호출하며 void를 반환합니다. 기본값을 포함해 첫 등록을 유지하고 거부한 콜백은 유지하지 않습니다. 이름은 정확하게 일치해야 합니다. 구조 등록은 전체 `data-` 이름을 해석기에 추가합니다. 정확한 속성을 사용하면 펼치지 않은 자식을 `rmlui-inner-rml`에 저장합니다. 초기화에는 원래 속성 표현식과 수정자를 전달합니다.

`Factory.instanceDataView(name, element)`와 `instanceDataController(name, element)`는 실제 소유 기본 인스턴스, 사용자 정의 인스턴스 또는 null을 반환합니다. 기본 뷰는 `attr`, `attrif`, `class`, `if`, `visible`, `rml`, `style`, `text`, `value`, `checked`, `alias`, `for`이며 기본 컨트롤러는 `checked`, `event`, `value`입니다. 생성기에서 기본 구현으로 위임해도 네이티브 동작과 해제 추적을 유지합니다.

직접 호출한 `instanceView(element)`와 `instanceController(element)`는 소유권을 호출자에게 반환합니다. RML 해석은 유일한 소유권을 Core에 이전하며 이전 완료, 만료, 초기화 완료, 다른 요소의 결과는 예외입니다. 수동 `initialize`는 한 번만 허용하며 모델 스케줄러에 등록하지 않습니다. 기본 컨트롤러는 초기화 시 네이티브 리스너를 등록하고 해제 시 제거합니다. 사용자 정의 호스트 리스너는 선택적 `release()` 훅에서 제거해야 합니다.

`getElement()`는 네이티브 관찰자를 사용하며 요소 파괴 후 null입니다. `isValid`는 해제와 세대도 검사합니다. `sortOrder`는 캐시한 깊이와 오프셋을 읽고 `getVariableNameList()`는 독립 목록을 반환합니다. `release()`는 호출자 소유 인스턴스만 파괴하며 콜백 실행 중이나 Core 소유 시 거부합니다. 기본 컨트롤러와 표현식의 콜백도 포함합니다. Core 파괴는 빌린 인터페이스를 무효화합니다. 해제 알림은 네이티브 처리 후 실행하며 캡처한 요소가 무효할 수 있습니다. 이전 예외와 환경 정리 시 알리지 않고 미참조 소유 인스턴스의 GC는 알림을 보장하지 않습니다. 소유 컨텍스트의 콜백 순환은 회수할 수 있습니다.

열두 기본 뷰와 세 컨트롤러의 로컬 상호작용 테스트 및 공식 네 모델과 트리 뷰의 상태 테스트를 통과했습니다.

저장소 유지보수 도구 `node packages/sfml.js-rmlui/tools/performance/measure-data.cjs`는 실제 바인딩 요소 1천·1만·10만 개와 네이티브 배열 루트 100개를 검증합니다. [측정 기록](audit/6.3/data-performance.md)에는 dirty 없음·1% dirty·전체 dirty 업데이트, 희소 패치, 뷰 매핑과 확장이 포함됩니다. 10만 행의 모델 업데이트는 한 번 측정했을 때 각각 0.051, 0.201, 18.781 ms이며 희소 업데이트는 해당하는 검증된 값 1,000개만 읽었습니다. 할당 및 복사 카운터는 데이터 저장소와 수치 배열 확장만 포함합니다. 전체 성능 및 플랫폼 검증은 아직 완료되지 않았습니다.
