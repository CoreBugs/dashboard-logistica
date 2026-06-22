import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as string[] | undefined;
  const user = auth.currentUser();

  if (!user || !allowedRoles?.includes(user.role)) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
