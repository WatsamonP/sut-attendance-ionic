import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ScanModalPage } from './scan-modal';

@NgModule({
  declarations: [
    ScanModalPage,
  ],
  imports: [
    IonicPageModule.forChild(ScanModalPage),
  ],
})
export class ScanModalPageModule {}
