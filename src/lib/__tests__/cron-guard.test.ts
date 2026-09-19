import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withCronErrorNotification } from '../cron-guard';

// De zes e-mail-cronroutes draaien onbewaakt via Vercel Cron - vóór deze wrapper resulteerde een
// onverwachte throw alleen in een 500 die nergens dan in Vercel's eigen logs zichtbaar werd. Deze
// test bewijst dat een falende job 1) de admin een mail stuurt en 2) nog steeds een 500
// teruggeeft (nooit stil een 200 doen alsof de job slaagde).

const { notifyAdminCronFailure } = vi.hoisted(() => ({ notifyAdminCronFailure: vi.fn() }));
vi.mock('../admin-notify', () => ({ notifyAdminCronFailure }));

function fakeRequest(): NextRequest {
  return { headers: new Headers(), url: 'http://localhost/api/email/test' } as unknown as NextRequest;
}

describe('withCronErrorNotification', () => {
  beforeEach(() => {
    notifyAdminCronFailure.mockReset();
    notifyAdminCronFailure.mockResolvedValue(undefined);
  });

  it('geeft het antwoord van de handler door als die niet faalt', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withCronErrorNotification('test-job', handler);

    const res = await wrapped(fakeRequest());

    expect(await res.json()).toEqual({ ok: true });
    expect(notifyAdminCronFailure).not.toHaveBeenCalled();
  });

  it('vangt een throw op, waarschuwt de admin en geeft toch een 500 terug (nooit stil een 200)', async () => {
    const error = new Error('Resend is onbereikbaar');
    const handler = vi.fn().mockRejectedValue(error);
    const wrapped = withCronErrorNotification('ochtend-motivatie', handler);

    const res = await wrapped(fakeRequest());

    expect(res.status).toBe(500);
    expect(notifyAdminCronFailure).toHaveBeenCalledWith('ochtend-motivatie', error);
  });

  it('laat een falende admin-notificatie zelf de 500-response niet breken', async () => {
    notifyAdminCronFailure.mockRejectedValue(new Error('ook Resend kapot'));
    const handler = vi.fn().mockRejectedValue(new Error('job faalde'));
    const wrapped = withCronErrorNotification('winback', handler);

    const res = await wrapped(fakeRequest());

    expect(res.status).toBe(500);
  });
});
