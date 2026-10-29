'use client';
import { useEffect, useState } from 'react';
import { toast } from '@/components/Toast';
import { useStoreSettings, useUpdateStoreSettings } from '@/hooks/useStoreSettings';
export default function SettingsPage() {
  const { data, isLoading, isError } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  useEffect(() => { if (data) { setPlayStoreUrl(data.playStoreUrl); setAppStoreUrl(data.appStoreUrl); } }, [data]);
  function isHttpsUrl(value: string) { try { return new URL(value).protocol === 'https:'; } catch { return false; } }
  function handleSave() {
    if (!isHttpsUrl(playStoreUrl) || !isHttpsUrl(appStoreUrl)) { toast.error('Both store links must be valid HTTPS URLs.', { title: 'Invalid links' }); return; }
    updateSettings.mutate({ playStoreUrl: playStoreUrl.trim(), appStoreUrl: appStoreUrl.trim() }, {
      onSuccess: () => toast.success('Store redirect links saved.', { title: 'Settings saved' }),
      onError: () => toast.error('Could not save store redirect links.', { title: 'Save failed' }),
    });
  }
  return <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6"><section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"><div className="max-w-3xl">
    <h1 className="text-2xl font-semibold text-slate-900">App Settings</h1><p className="mt-1 text-sm text-slate-500">Shared coupon links use these destinations when CityDeals is not installed.</p>
    {isLoading ? <p className="mt-8 text-sm text-slate-500">Loading settings...</p> : isError ? <p className="mt-8 text-sm text-red-600">Could not load settings.</p> : <div className="mt-6 grid gap-5">
      <label className="grid gap-2 text-sm"><span className="font-medium text-slate-900">Google Play Store URL</span><input className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-orange-400" value={playStoreUrl} onChange={(e) => setPlayStoreUrl(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=com.citydeals.app" /><small className="text-slate-500">Used for Android devices.</small></label>
      <label className="grid gap-2 text-sm"><span className="font-medium text-slate-900">Apple App Store URL</span><input className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-orange-400" value={appStoreUrl} onChange={(e) => setAppStoreUrl(e.target.value)} placeholder="https://apps.apple.com/app/id..." /><small className="text-slate-500">Used for iPhone and iPad devices.</small></label>
      <button type="button" onClick={handleSave} disabled={updateSettings.isPending} className="h-11 w-fit rounded-xl bg-[#f97316] px-6 text-sm font-medium text-white disabled:opacity-50">{updateSettings.isPending ? 'Saving...' : 'Save Settings'}</button>
    </div>}
  </div></section></div>;
}
