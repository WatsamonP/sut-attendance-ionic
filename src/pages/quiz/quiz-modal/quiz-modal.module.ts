import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { QuizModalPage } from './quiz-modal';

@NgModule({
  declarations: [
    QuizModalPage,
  ],
  imports: [
    IonicPageModule.forChild(QuizModalPage),
  ],
})
export class QuizModalPageModule {}
