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
  const [cooldownUnit, setCooldownUnit] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  useEffect(() => { if (data) { setPlayStoreUrl(data.playStoreUrl); setAppStoreUrl(data.appStoreUrl); } }, [data]);
  useEffect(() => {
    if (redemptionRules) {
      setCooldownValue(redemptionRules.cooldownValue);
      setCooldownUnit(redemptionRules.cooldownUnit);
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
    updateRedemptionRules.mutate({ cooldownValue, cooldownUnit }, {
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
    <div className="mt-10 border-t border-slate-200 pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Coupon Redemption Rules</h2>
        <p className="text-sm text-slate-500">Control how often users can redeem coupons across the platform.</p>
      </div>
      {redemptionRulesLoading ? <p className="mt-6 text-sm text-slate-500">Loading redemption rules...</p> : <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Coupon re-redemption time</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Minimum waiting time before the same coupon can be redeemed again.</p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_128px] gap-3">
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              <span>Value</span>
              <input type="number" min="0" step="1" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={cooldownValue} onChange={(e) => setCooldownValue(Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              <span>Unit</span>
              <select className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={cooldownUnit} onChange={(e) => setCooldownUnit(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">Use <span className="font-semibold text-slate-700">0</span> to disable the global cooldown.</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
          <p className="text-xs text-slate-500">Changes apply to new redemption attempts immediately.</p>
          <button type="button" onClick={handleSaveRedemptionRules} disabled={updateRedemptionRules.isPending} className="h-11 w-full rounded-xl bg-[#f97316] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{updateRedemptionRules.isPending ? 'Saving...' : 'Save Redemption Rules'}</button>
        </div>
      </div>}
    </div>
  </div></section></div>;
}
