// eslint-disable-next-line max-len
// https://stackoverflow.com/questions/39494689/is-it-possible-to-restrict-number-to-a-certain-range
declare module '*/binding.node' {
  type BuildArray<
    Length extends number,
    Ele = unknown,
    Arr extends unknown[] = []
  > = Arr['length'] extends Length ?
    Arr :
    BuildArray<Length, Ele, [ ...Arr, Ele ]>;

  type Add<
    Num1 extends number,
    Num2 extends number,
  > = [
    ...BuildArray<Num1>,
    ...BuildArray<Num2>,
  ]['length'];
  type Subtract<
    Num1 extends number,
    Num2 extends number,
  > = BuildArray<Num1> extends [
    ...arr1: BuildArray<Num2>,
    ...arr2: infer Rest,
  ] ? Rest['length'] : never;

  type _RangeOf<
    start extends number,
    end extends number,
    R extends unknown[] = [ start ],
  > = R['length'] extends Subtract<end, start> ?
    [ ...R, end ][number] :
    _RangeOf<start, end, [ ...R, Add<start, R['length']> ]> ;
}
