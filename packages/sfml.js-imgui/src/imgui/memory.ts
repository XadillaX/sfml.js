import { native } from '../internal/native';

/**
 * Allocate memory using Dear ImGui's configured allocator.
 *
 * @zh 使用 Dear ImGui 配置的分配器分配内存。
 * @ja Dear ImGui に設定されたアロケーターでメモリを確保します。
 * @ko Dear ImGui에 설정된 할당자로 메모리를 할당합니다.
 *
 * @param size - Number of bytes requested from the ImGui allocator.
 * @zh size - 向 ImGui 分配器请求的字节数。
 * @ja size - ImGui アロケーターに要求するバイト数です。
 * @ko size - ImGui 할당자에 요청하는 바이트 수입니다.
 *
 * @returns Allocated native address as bigint; a null allocator result is
 * represented by 0n. Release nonzero addresses with MemFree(), not a JS memory
 * API.
 * @zh 分配的原生地址 bigint；分配器返回空指针时表示为 0n。使用 MemFree() 释放非零地址，而非 JS 内存 API。
 * @ja 確保したネイティブアドレスの bigint です。空ポインターは 0n になります。非ゼロのアドレスは MemFree() で解放します。
 * @ko 할당된 네이티브 주소 bigint입니다. null 포인터는 0n으로 나타냅니다. 0이 아닌 주소는 JS 메모리 API가 아닌
 * MemFree()로 해제합니다.
 */
export function MemAlloc(size: number): bigint {
  return native.MemAlloc(size);
}

/**
 * Free memory using Dear ImGui's configured deallocator.
 *
 * @zh 使用 Dear ImGui 配置的释放器释放内存。
 * @ja Dear ImGui に設定された解放関数でメモリを解放します。
 * @ko Dear ImGui에 설정된 해제 함수로 메모리를 해제합니다.
 *
 * @param ptr - Native address previously obtained with MemAlloc(), released
 * using ImGui allocator hooks.
 * @zh ptr - 先前由 MemAlloc() 得到的原生地址，使用 ImGui 分配器钩子释放。
 * @ja ptr - MemAlloc() で取得したネイティブアドレスです。ImGui のアロケーターフックで解放します。
 * @ko ptr - MemAlloc()으로 얻은 네이티브 주소이며 ImGui 할당자 훅으로 해제합니다.
 */
export function MemFree(ptr: bigint | null): void {
  native.MemFree(ptr);
}
