import { Log, LogType, type SystemCallbacks } from '../../src';

Log.message(LogType.Info, 'value %s = %d', 'width', 12);
Log.parseError('panel.rml', 12, 'Unexpected %s', 'tag');
Log.parseError('panel.rml', -1, 'Missing document');

const callback: SystemCallbacks = {
  logMessage(type, message) {
    return type !== LogType.Assert || message.length > 0;
  },
};
void callback;

// @ts-expect-error Raw pointer objects are outside the checked scalar domain.
Log.message(LogType.Info, '%s', {});
// @ts-expect-error Filenames must be strings.
Log.parseError({}, 12, 'invalid');
