import { SFMLError } from '../src';

const error = new SFMLError('SFML failed');
const standard: Error = error;
const name: string = error.name;
const message: string = error.message;
const stack: string | undefined = error.stack;
if (standard instanceof SFMLError) {
  const matched: SFMLError = standard;
  void matched;
}
void [ name, message, stack, new SFMLError() ];
