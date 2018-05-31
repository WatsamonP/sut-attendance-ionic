import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { QuizModalPersonPage } from './quiz-modal-person';

@NgModule({
  declarations: [
    QuizModalPersonPage,
  ],
  imports: [
    IonicPageModule.forChild(QuizModalPersonPage),
  ],
})
export class QuizModalPersonPageModule {}
