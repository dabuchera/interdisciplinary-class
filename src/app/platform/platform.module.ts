import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { ViewerModule } from '../viewer/viewer.module';

// Primeng Import
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ButtonModule } from 'primeng/button';

@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    ViewerModule,
    MessagesModule,
    MessageModule,
    ToastModule,
    BrowserAnimationsModule,
    ButtonModule,
  ],
  exports: [MainComponent],
  providers: [MessageService]
})
export class PlatformModule { }
