import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AuthServiceProvider } from './auth.service';
import { AngularFireDatabase } from 'angularfire2/database';
import moment from 'moment';

@Injectable()
export class StudentService {

  scheduleAttendanceList : any;
  course_id : String;

  private noteListRef;
  private path;
  user: any;

  constructor(
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase) {        
  }  

}