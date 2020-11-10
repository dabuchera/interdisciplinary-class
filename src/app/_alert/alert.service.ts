import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Alert, AlertType } from './alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private subject = new Subject<Alert>();
    private keepAfterRouteChange = false;

    constructor(private router: Router) {
        // clear alert messages on route change unless 'keepAfterRouteChange' flag is true
        this.router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                if (this.keepAfterRouteChange) {
                    // only keep for a single route change
                    this.keepAfterRouteChange = false;
                } else {
                    // clear alert messages
                    this.clear();
                }
            }
        });
    }

    // enable subscribing to alerts observable
    onAlert(alertId?: string): Observable<Alert> {
        return this.subject.asObservable().pipe(filter(x => x && x.alertId === alertId));
    }

    // convenience methods
    success(message: string, alertId?: string) {
        message = 'Server Success : ' + message;
        this.alert(new Alert({ message, type: AlertType.Success, alertId }));
        // Nach 3 Sekunden den Alert wieder verschwinden lassen
        setTimeout(() => {
            this.clear(alertId);
        }, 5000);
    }

    error(message: string, alertId?: string) {
        message = 'Server Error : ' + message;
        this.alert(new Alert({ message, type: AlertType.Error, alertId }));
        // Nach 4 Sekunden den Alert wieder verschwinden lassen
        setTimeout(() => {
            this.clear(alertId);
        }, 5000);
    }

    info(message: string, alertId?: string) {
        message = 'Server Info : ' + message;
        this.alert(new Alert({ message, type: AlertType.Info, alertId }));
        // Nach 3 Sekunden den Alert wieder verschwinden lassen
        setTimeout(() => {
            this.clear(alertId);
        }, 5000);
    }

    warn(message: string, alertId?: string) {
        message = 'Server Warn : ' + message;
        this.alert(new Alert({ message, type: AlertType.Warning, alertId }));
        // Nach 3 Sekunden den Alert wieder verschwinden lassen
        setTimeout(() => {
            this.clear(alertId);
        }, 5000);
    }

    // main alert method
    alert(alert: Alert) {
        this.openOverlay();
        // Hier geändert
        // setTimeout(() => {
        this.keepAfterRouteChange = alert.keepAfterRouteChange;
        this.subject.next(alert);
        // }, 5000);

    }

    alertuserExperience(alert: Alert) {
        this.openOverlay();
        setTimeout(() => {
            this.keepAfterRouteChange = alert.keepAfterRouteChange;
            this.subject.next(alert);
        }, 250);
    }

    // clear alerts
    clear(alertId?: string) {
        this.closeOverlay();
        setTimeout(() => {
            this.subject.next(new Alert({ alertId }));
        }, 500);
    }

    clearuserExperience(alertId?: string) {
        setTimeout(() => {
            this.subject.next(new Alert({ alertId }));
        }, 500);
    }

    userExperience(message: string, alertId?: string) {
        message = message;
        this.alertuserExperience(new Alert({ message, type: AlertType.Success, alertId }));
        // Nach 3 Sekunden den Alert wieder verschwinden lassen
    }

    openOverlay() {
        document.getElementById('overlay-alert').style.height = '100%';
    }

    closeOverlay() {
        document.getElementById('overlay-alert').style.height = '0%';
    }
}
