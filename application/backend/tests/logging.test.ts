import {expect, spyOn, test} from 'bun:test';
import {reportFailure} from '@utils/utils';
import {ApiError} from '@core/security';

test('failure logs retain categories and provider status without private exception messages', () => {
  const log = spyOn(console, 'error').mockImplementation(() => {});

  try {
    const privateFailure = Object.assign(new Error('private-password and private-message-body'), {code: '23505', status: 503});
    reportFailure('Provider read', privateFailure);
    reportFailure('Authorization', new ApiError(403, 'forbidden', 'private-authentication-payload'));

    expect(log.mock.calls[0][1]).toEqual({operation: 'Provider read', category: '23505', status: 503});
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-');
  } finally {
    log.mockRestore();
  }
});
