import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AuthServiceProvider } from './auth.service';
import { AngularFireDatabase } from 'angularfire2/database';
import moment from 'moment';
import { AlertController, NavParams } from 'ionic-angular';

@Injectable()
export class AttendanceService {
  course_id : String;
  scheduleAttendanceList : any;
  studentList : any;
  attendance_id : any;
  attendance_status : String;
  attendance_score : Number;
  attendanceData : any;
  lateTime : any;
  lateScore : any;
  onTimeScore : any;
  leaveScore : any;
  
  constructor(
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    public alertCtrl: AlertController) {  
  }

  public createDefaultAttendance(course_id,studentList,lateTime,score){   //work
    this.studentList = [];
    this.studentList = studentList;
    let studentCount = Number(this.studentList.length);
    let dateId = moment().format("DD-MM-YYYY-HH-mm-ss"); 
    this.attendance_id = dateId;
    let temp = moment(lateTime).format(); 

    this.db.object(`users/${this.auth.currentUserId()}/course/${course_id}/schedule/attendance/${dateId}`)
      .update({
        id : dateId,
        date : Date(),                                                         
        lateTime : temp,
        lateScore : score.lateScore,
        onTimeScore : score.onTimeScore,
        leaveScore : score.leaveScore,
        countLate : 0, 
        countMiss : studentCount, 
        countOnTime : 0, 
        countLeave : 0,
      });

    for(var i=0 ; i<studentCount ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${course_id}/students/${this.studentList[i].id}/attendance/${dateId}`)
        .update({
          score : 0,
          status : 'Missed Class',
      });
    }
  }

  ////////////////////////////////////////////////////////////////////////////////

  public saveSetting(course_id, id, updateData){  //work
    this.db.object(`users/${this.auth.currentUserId()}/course/${course_id}/schedule/attendance/${id}`)
      .update({
        lateTime : updateData.lateTime,
        lateScore : updateData.lateScore,
        onTimeScore : updateData.onTimeScore,
        leaveScore : updateData.leaveScore
    });
  }

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  public getAttendance_id(){
    return this.attendance_id;
  }

}