# Dashboard API Checklist

## Package usage

- [x] Axios: use `apiClient` from `api/client.ts` for every HTTP request.
- [x] Zustand: use `useAuthStore` for dashboard auth state and token persistence.
- [x] TanStack Query: wrap app with `QueryProvider` and use `useQuery` / `useMutation` for server state.

## Add a new GET API

- [x] Add the endpoint function in `api/<feature>.ts`.
- [x] Add a stable key in `api/queryKeys.ts`.
- [x] Add a hook in `hooks/use<Feature>.ts` or a feature-specific hook file.
- [x] Use the hook in the page/component instead of `useEffect + useState`.

Example:

```ts
export const categoriesApi = {
  list: () => apiClient.get<unknown, Category[]>("/categories"),
};

useQuery({
  queryKey: ["categories"],
  queryFn: categoriesApi.list,
});
```

## Add a create/update/delete API

- [x] Add `post`, `patch`, or `delete` function in `api/<feature>.ts`.
- [x] Use `useMutation` in the page or hook.
- [x] On success, call `queryClient.invalidateQueries({ queryKey })`.
- [x] Show success/error toast from mutation callbacks.
- [x] For fast UI, optionally update cache with `queryClient.setQueryData`.

## Endpoint map

- [x] Auth: `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/verify-otp`, `POST /auth/reset-password`, `GET /auth/me`
- [x] Dashboard overview: `GET /admin/dashboard/stats`, `GET /admin/dashboard/trending-coupons`, `GET /admin/dashboard/redemptions/by-area`
- [x] Users: `GET /admin/users`, `PATCH /admin/users/:id/status`
- [x] Staff: `GET /admin/staff`, `POST /admin/staff`, `PATCH /admin/staff/:id/role`, `PATCH /admin/staff/:id/status`, `DELETE /admin/staff/:id`
- [x] Roles: `GET /admin/roles`, `PATCH /admin/roles/permissions`
- [x] Businesses/Merchants: `GET /merchants`, `POST /merchants`, `PATCH /merchants/:id`, `DELETE /merchants/:id`
- [x] Categories: `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`
- [x] Coupons: `GET /coupons`, `POST /coupons`, `PATCH /coupons/:id`, `DELETE /coupons/:id`
- [x] Areas: `GET /areas`, `POST /areas`, `PATCH /areas/:id`, `DELETE /areas/:id`, `POST /areas/:id/regenerate-qr`, `POST /areas/regenerate-all-qr`
- [x] Redemptions: `GET /admin/redemptions`
- [x] Notifications: `GET /notifications/admin/history`, `POST /notifications/send`
- [x] Support: `GET /support/tickets`, `PATCH /support/tickets/:id/status`, `PATCH /support/tickets/:id/reply`
- [x] Legal pages: `GET /legal/pages`, `GET /legal/pages/:type`, `PUT /legal/pages/:type`
- [x] Upload: `POST /upload`, `POST /upload/base64`, `DELETE /upload`

## Recommended migration order

- [x] Move repeated page-level Axios calls into `api/<feature>.ts`.
- [x] Keep React Query hooks inside `hooks/` and raw endpoint functions inside `api/`.
- [x] Replace page loading booleans with TanStack Query `isLoading` / `isFetching`.
- [x] Replace save/delete booleans with mutation `isPending`.
- [x] Keep Zustand only for client state such as auth, filters that must persist, and UI preferences.
- [x] Keep TanStack Query for all backend data.
