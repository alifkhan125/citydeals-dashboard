'use client';
import { useEffect, useState } from 'react';
import { toast } from '@/components/Toast';
import { useStoreSettings, useUpdateStoreSettings } from '@/hooks/useStoreSettings';
import { useRedemptionRules, useUpdateRedemptionRules } from '@/hooks/useStoreSettings';
export default function SettingsPage() {
  const { data, isLoading, isError } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const { data: redemptionRules, isLoading: redemptionRulesLoading } = useRedemptionRules();
  const updateRedemptionRules = useUpdateRedemptionRules();
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  const [cooldownValue, setCooldownValue] = useState(0);
  const [cooldownUnit, setCooldownUnit] = useState<'HOURS' | 'DAYS'>('HOURS');
  const [dailyLimit, setDailyLimit] = useState(0);
  useEffect(() => { if (data) { setPlayStoreUrl(data.playStoreUrl); setAppStoreUrl(data.appStoreUrl); } }, [data]);
  useEffect(() => {
    if (redemptionRules) {
      setCooldownValue(redemptionRules.cooldownValue);
      setCooldownUnit(redemptionRules.cooldownUnit);
      setDailyLimit(redemptionRules.dailyLimit);
    }
  }, [redemptionRules]);
  function isHttpsUrl(value: string) { try { return new URL(value).protocol === 'https:'; } catch { return false; } }
  function handleSave() {
    if (!isHttpsUrl(playStoreUrl) || !isHttpsUrl(appStoreUrl)) { toast.error('Both store links must be valid HTTPS URLs.', { title: 'Invalid links' }); return; }
    updateSettings.mutate({ playStoreUrl: playStoreUrl.trim(), appStoreUrl: appStoreUrl.trim() }, {
      onSuccess: () => toast.success('Store redirect links saved.', { title: 'Settings saved' }),
      onError: () => toast.error('Could not save store redirect links.', { title: 'Save failed' }),
    });
  }
  function handleSaveRedemptionRules() {
    updateRedemptionRules.mutate({ cooldownValue, cooldownUnit, dailyLimit }, {
      onSuccess: () => toast.success('Coupon redemption rules saved.', { title: 'Rules saved' }),
      onError: () => toast.error('Could not save coupon redemption rules.', { title: 'Save failed' }),
    });
  }
  return <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6"><section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"><div className="max-w-3xl">
    <h1 className="text-2xl font-semibold text-slate-900">App Settings</h1><p className="mt-1 text-sm text-slate-500">Shared coupon links use these destinations when CityDeals is not installed.</p>
    {isLoading ? <p className="mt-8 text-sm text-slate-500">Loading settings...</p> : isError ? <p className="mt-8 text-sm text-red-600">Could not load settings.</p> : <div className="mt-6 grid gap-5">
      <label className="grid gap-2 text-sm"><span className="font-medium text-slate-900">Google Play Store URL</span><input className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-orange-400" value={playStoreUrl} onChange={(e) => setPlayStoreUrl(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=com.citydeals.app" /><small className="text-slate-500">Used for Android devices.</small></label>
      <label className="grid gap-2 text-sm"><span className="font-medium text-slate-900">Apple App Store URL</span><input className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-orange-400" value={appStoreUrl} onChange={(e) => setAppStoreUrl(e.target.value)} placeholder="https://apps.apple.com/app/id..." /><small className="text-slate-500">Used for iPhone and iPad devices.</small></label>
      <button type="button" onClick={handleSave} disabled={updateSettings.isPending} className="h-11 w-fit rounded-xl bg-[#f97316] px-6 text-sm font-medium text-white disabled:opacity-50">{updateSettings.isPending ? 'Saving...' : 'Save Settings'}</button>
    </div>}
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-xl font-semibold text-slate-900">Coupon Redemption Rules</h2>
      <p className="mt-1 text-sm text-slate-500">These rules apply globally to every user and coupon.</p>
      {redemptionRulesLoading ? <p className="mt-6 text-sm text-slate-500">Loading redemption rules...</p> : <div className="mt-6 grid gap-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <label className="grid gap-2 text-sm"><span className="font-medium text-slate-900">Coupon re-redemption time</span><input type="number" min="0" step="1" className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-orange-400" value={cooldownValue} onChange={(e) => setCooldownValue(Math.max(0, Number(e.target.value) || 0))} /><small className="text-slate-500">Set 0 to disable this global cooldown.</small></label>
          <label className="grid gap-2 text-sm"><span className="font-medium text-slate-900">Unit</span><select className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-orange-400" value={cooldownUnit} onChange={(e) => setCooldownUnit(e.target.value as 'HOURS' | 'DAYS')}><option value="HOURS">Hours</option><option value="DAYS">Days</option></select></label>
        </div>
        <label className="grid max-w-sm gap-2 text-sm"><span className="font-medium text-slate-900">Daily maximum redemptions per user</span><input type="number" min="0" step="1" className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-orange-400" value={dailyLimit} onChange={(e) => setDailyLimit(Math.max(0, Number(e.target.value) || 0))} /><small className="text-slate-500">Set 0 for unlimited. The limit includes all coupons.</small></label>
        <button type="button" onClick={handleSaveRedemptionRules} disabled={updateRedemptionRules.isPending} className="h-11 w-fit rounded-xl bg-[#f97316] px-6 text-sm font-medium text-white disabled:opacity-50">{updateRedemptionRules.isPending ? 'Saving...' : 'Save Redemption Rules'}</button>
      </div>}
    </div>
  </div></section></div>;
}
