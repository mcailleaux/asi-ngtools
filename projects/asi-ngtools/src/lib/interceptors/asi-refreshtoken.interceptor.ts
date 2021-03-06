import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { tap, catchError, switchMap, first } from 'rxjs/operators';

export abstract class AsiRefreshTokenInceptor implements HttpInterceptor {

  private static readonly UNAUTHORIZED = 401;
  private refreshingToken = false;

  private loginUrl;
  private refreshTokenUrl;

  private refreshTokenSubject = new Subject<any>();

  constructor() {
    this.refreshTokenUrl = this.getRefreshTokenUrl();
    this.loginUrl = this.getLoginUrl();
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    req = this.addAuthenticationToken(req, false);

    return next.handle(req).pipe(tap(evt => {
      this.onRequestSuccess(evt);
    }), catchError((err) => {

      // Not a 401 or fail on login page
      // tslint:disable-next-line:triple-equals
      if ((err.status != AsiRefreshTokenInceptor.UNAUTHORIZED && !req.url.includes(this.refreshTokenUrl))
        || req.url.includes(this.loginUrl)) {
        return throwError(err);
      }

      // Fail to refresh the token, go to login page
      if (req.url.includes(this.refreshTokenUrl)) {
        this.refreshingToken = false;
        this.goToLoginPage(req, err);
        return throwError(err);
      }

      if (this.refreshingToken) {
        // refresh token is in progress, we subscribe to the unlocking event
        return this.refreshTokenSubject.pipe(first(), switchMap(() => {
          return next.handle(this.addAuthenticationToken(req, true));
        }));
      } else {
        this.refreshingToken = true;
        // get and save the refresh token and unlock requests
        return this.callAndSaveRefreshToken().pipe(first(), switchMap((token: any) => {
          this.refreshingToken = false;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addAuthenticationToken(req, true));
        }), catchError((error) => {
          this.refreshingToken = false;
          this.goToLoginPage(req, error)
          return throwError(error);
        }));
      }
    }));
  }

  onRequestSuccess(_event: HttpEvent<any>): void { }

  /**
   *  Add auth token to the request header
   * @param req  the request
   * @param replay is the token replayed
   */
  abstract addAuthenticationToken(req: HttpRequest<any>, replay: boolean): HttpRequest<any>;

  /**
   *  Get the refresh token endpoint url
   */
  abstract getRefreshTokenUrl(): string;

  /**
   *  Call the refresh token endpoint and save the new token
   */
  abstract callAndSaveRefreshToken(): Observable<any>;

  /**
   * Get the login endpoint url
   */
  abstract getLoginUrl(): string;

  /**
   * Change the current page to the login page
   * @param req the request
   * @param err  the err
   */
  abstract goToLoginPage(req: HttpRequest<any>, err: any): void;
}
