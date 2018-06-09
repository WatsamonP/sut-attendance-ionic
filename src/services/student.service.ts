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

  createDefaultAttendance(lateTime, lateScore, onTimeScore){
    //this.lateTime = lateTime;
    //this.lateScore = lateScore;
    //this.onTimeScore = onTimeScore;
    let dateId = moment().format("DD-MM-YYYY-HH-mm-ss"); 
    console.log()
    let course_id = "333333";

    this.db.object(`users/${this.auth.currentUserId()}/course/${course_id}/schedule/attendance/${dateId}`)
    .update({
      id : dateId,
      date : Date(),                                                         
      lateTime : lateTime,
      lateScore : lateScore,
      onTimeScore : onTimeScore,
      //countLate : 0, countMiss : studentCount, countOnTime : 0, countLeave : 0,
    });
    // Set 0 Score
    /*
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/attendance/${dateId}`)
        .update({
          score : 0,
          status : 'Missed Class',
      });
    }

    // then Scan
    //this.scanQR(dateId);
    this.pushToScanPage(dateId);
    */
  }
  

}