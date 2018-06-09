import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ScanQuizPage } from './scan-quiz';

@NgModule({
  declarations: [
    ScanQuizPage,
  ],
  imports: [
    IonicPageModule.forChild(ScanQuizPage),
  ],
})
export class ScanQuizPageModule {}
