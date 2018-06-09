import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ManageAttendancePage } from './manage-attendance';

@NgModule({
  declarations: [
    ManageAttendancePage,
  ],
  imports: [
    IonicPageModule.forChild(ManageAttendancePage),
  ],
})
export class ManageAttendancePageModule {}
