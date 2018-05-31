import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';

import { AuthServiceProvider } from './auth.service';
import { AngularFireDatabase } from 'angularfire2/database';

import { Course } from './course.model';


@Injectable()
export class CourseService {

  scheduleAttendanceList : any;
  course_id : String;

  private noteListRef;
  private path;
  user: any;

  constructor(
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase) {

      this.path = `users/${this.auth.currentUserId()}/course/123456/schedule/attendance`;
      //this.noteListRef = this.db.list<Course>('users/${this.auth.currentUserId()}/course/123456/schedule/attendance');
      this.db.list(this.path).snapshotChanges().map(actions => {
        return actions.map(action => ({ key: action.key, ...action.payload.val() }));
        }).subscribe(items => {
          this.scheduleAttendanceList = items;
            //return items;
            return items.map(item => item.key);
        });
        


        console.log(this.course_id);

        
  }

  getAllCatList() {
    var promise = new Promise((resolve, reject) => {
        this.path.orderByChild('uid').once('value', (snapshot) => {
            let Catdata = snapshot.val();
            let temparr = [];
            for (var key in Catdata) {
                temparr.push(Catdata[key]);
            }
            resolve(temparr);
        }).catch((err) => {
            reject(err);
        })
    })
    return promise;
}
/*
  getCourseList(){
    this.db.list(this.path)
    .snapshotChanges().map(actions => {
      return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      })
  }
  */

  getNoteList() {
    return this.scheduleAttendanceList;
  }

  addCourse(){
        
  }

  updateCourse(){
        
  }

  removeCourseList(){
        
  }

  getCourseList(course_id : String){
    console.log(course_id);
    this.course_id = course_id;

    return this.noteListRef;
  }
  
  getScheduleAttendanceList(){
     return this.scheduleAttendanceList;
  }

	

}