import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('esto_token');

  // Si on a un token, on l'ajoute dans le header Authorization
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  const router = inject(Router);

  return next(clonedReq).pipe(
    catchError((error) => {
      // Si le backend retourne 401 (Non autorisé)
      if (error.status === 401) {
        localStorage.removeItem('esto_token');
        localStorage.removeItem('esto_user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
