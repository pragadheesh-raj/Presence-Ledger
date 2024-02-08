const csvToJson = require('convert-csv-to-json');
const fs = require('fs');
const date = require('date-and-time');
const csv = require('fast-csv');
const emp_data = require('./e_data.json');
//const csv = require('csvtojson');

const commaSeparate = (text) => {
  return text.replace(/\s/g, ",") + "\n";
};

/*const compareDates = (d1,d2) =>{
  var d_1 = date.parse(d1, 'YYYY-MM-DD', true);
  var d_2 = date.parse(d2, 'YYYY-MM-DD', true);
  return (d_2 - d_1)/86400000;
};*/

const compareDates = (d1,d2) =>{
    var d_1 = date.parse(d1, 'DD/MM/YYYY', true);
    var d_2 = date.parse(d2, 'DD/MM/YYYY', true);
    return (d_2 - d_1)/86400000;
  };

function roundHrs(value, step) {
  step || (step = 1.0);
  var inv = 1.0 / step;
  return parseFloat(value);
  //return Math.round(value * inv) / inv;
}
function calcWorkDay(hours, time1){
  
  if(time1 == undefined){
    time1 = "";
  }
  if(hours >= 4){
    var t_1 = date.transform(time1, 'HH:mm', 'hh:mm:ss A');
    var t_2 = date.transform('12:30', 'HH:mm', 'hh:mm:ss A');

    t_1 = new Date(date.parse(t_1, 'hh:mm:ss A', true))
    t_2 = new Date(date.parse(t_2, 'hh:mm:ss A', true))
    var d = t_2.getTime() - t_1.getTime();
    //console.log(d)
    if(d > 0){
      if(parseFloat(hours) >= 5){
        /*if(parseFloat(hours) >= 7.5){
          return 1;
        }
        else{
          return 0.5
        }*/
        return 1;
      }
      else if(parseFloat(hours) < 0){
        return 1;
      }
      else if(parseFloat(hours) < 2){
        return ""
      }
      else if(parseFloat(hours) < 5){
        return 0.5
      }
      else{
        return "";
      }
    }
    else if(isNaN(d)){
      return "";
    }
    else {
      return 0.5
    }
  }
  else{
    return 0;
  }
}

function w_days(arr){
  var sum = 0;
  for(var i = 0;i< arr.length; i++){
    if(arr[i].w_day != ""){
      sum += parseFloat(arr[i].w_day)
    }
    
  }
  return sum;
}

function cal_ot_days(arr){
  var sum = 0;
  for(var i = 0;i< arr.length; i++){
    sum += arr[i].ot_hours
  }
  
  return floatToTime(sum.toFixed(2));
}

function cal_late_hours(arr){
  var sum = 0;
  for(var i = 0;i< arr.length; i++){
    sum += arr[i].late_hours
  }
  
  return floatToTime(sum.toFixed(2));
}

const cal_total_tiffen = (arr) =>{
  var sum = 0;
  for(var i = 0;i< arr.length; i++){
    if(arr[i].w_day != ""){
      sum += arr[i].tiffen
    }    
  }
  return sum;
}

var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
//var array = fs.readFileSync('./NOV-ATT.txt').toString().split("\n");
var start_date = '';
var end_date = '';

var jsonArray = [];
var obj = {}

/*csv()
    .fromFile('ATT-AUG.csv')
    .then((jsonObj) => {
      console.log(jsonObj[0])
        // Writing JSON array to file
        fs.writeFile(jsonFilePath, JSON.stringify(jsonObj, null, 4), (err) => {
            if (err) {
                console.error('An error occurred:', err);
                return;
            }
            console.log('CSV file successfully converted to JSON and saved to', jsonFilePath);
        });
    })
    .catch((error) => {
        console.error('Error converting CSV to JSON:', error);
    });*/

/*fs.createReadStream('JAN-ATT.csv')
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => { 
      var temp = {'18':'','19':'','21':'','22':'','23':'','24':''};
      temp['18'] = row[' Employee Code ']
      temp['19'] = row['Employee Name']
      temp['21'] = row['Category ']
      temp['22'] = row['Date']
      temp['23'] = row[' In Time ']
      temp['24'] = row['Out Time ']
      console.log(temp) 
    })
    .on('end', rowCount => console.log(`Parsed ${rowCount} rows`));*/
function processAtt(fileName){
  fs.createReadStream(fileName)
    //.pipe(csv.parse({ headers: [undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,18,19,undefined,21,22,23,24,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined] }))
    //.pipe(csv.parse({ headers: ['Date', 'Employee Code' ,'Employee Name','Company' ,'Department','Category' ,'Degination','Grade','Team','Shift', 'In Time' ,'Out Time' , 'Duration' ,'Late By' ,'Early By' ,'Status' ,'Punch Records' ,'Overtime'] }))
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    //.on('data', row => jsonArray.push(row))
    .on('data', row => {
      var temp = {'18':'','19':'','21':'','22':'','23':'','24':''};
      temp['18'] = row[' Employee Code ']
      temp['19'] = row['Employee Name']
      temp['21'] = row['Category ']
      temp['22'] = row['Date']
      temp['23'] = row[' In Time '] != undefined ? (row[' In Time '].split(':').map(part => part.length === 1 ? '0' + part : part).join(':')):'';
      temp['24'] = row['Out Time ']!= undefined ? (row['Out Time '].split(':').map(part => part.length === 1 ? '0' + part : part).join(':')):'';
      jsonArray.push(temp)
    })
    .on('end', rowCount => {

        start_date = jsonArray[0]['22'];
        end_date = jsonArray[jsonArray.length - 1]['22'];
        att_calc();
        //console.log(jsonArray)
        console.log(`Parsed ${rowCount} rows`)
    });  
}

const att_calc = () => {
    var total_days = compareDates(start_date, end_date);
    var obj = {};

    jsonArray.forEach((item, i) => {
        obj[parseInt(item['18'])] = []
        for(var i = 0; i<= total_days; i++){
            obj[parseInt(item['18'])].push({'date':"",'logIn':"",'logOut':""})
        }
    })

    for(var keys in obj){
        for(var i = 0;i< obj[keys].length; i++){
      
          if(obj[keys][i].date == ""){
            var d = date.parse(start_date, "DD/MM/YYYY", true);
            obj[keys][i].date = date.format(date.addDays(d, i), "YYYY-MM-DD",true);
            obj[keys][i].day = days[new Date(obj[keys][i].date).getDay()];
          }
          else {
            obj[keys][i].day = days[new Date(obj[keys][i].date).getDay()];
          }
        }
    }
    
    jsonArray.forEach((item, i) => {
        var i = compareDates(start_date,item['22']);
        obj[parseInt(item['18'])][i].logIn = item['23'];
        obj[parseInt(item['18'])][i].logOut = item['24'];
        obj[parseInt(item['18'])][i].hours = calculateHours(obj[parseInt(item['18'])][i].logOut,obj[parseInt(item['18'])][i].logIn);
        obj[parseInt(item['18'])][i].late_hours = calculateLateHours(obj[parseInt(item['18'])][i].logIn,calcWorkDay(obj[parseInt(item['18'])][i].hours,obj[parseInt(item['18'])][i].logIn));
        obj[parseInt(item['18'])][i].ot_hours = calculateOTHours(obj[parseInt(item['18'])][i].hours, obj[parseInt(item['18'])][i].logOut);
        obj[parseInt(item['18'])][i].w_day = calcWorkDay(obj[parseInt(item['18'])][i].hours,obj[parseInt(item['18'])][i].logIn);
    })
    
    writeToFile(obj)
    //.log(Object.keys(obj).length)
} 

const writeToFile = (obj) => {
    var file = fs.createWriteStream('/app/uploads/Calc.csv');
    file.on('error', function(err) { });
    //file.write("EId,Day,Date,Log In,Log Out,Lunch In,Lunch Out,Total Hours\n");
    file.write("EId,Day,Date,Log In,Late Hours,Log Out,Total Hours, Total Days,OT Hours,Tiffen Cost\n");
    for(var keys in obj){
      var e = getEmployee(keys)
      //console.log(e)
      if(e != undefined){
        file.write( "Employee Code & Name, "+ keys + "," + e.e_name +"\n");
      }
      else{
        e = {g:"MALE"};
        file.write( "Employee Code & Name, "+ keys +",Name\n");
      }
      
      //file.write( keys +",Date, Log In, Log Out, Lunch In, Lunch Out, Total Hours\n");
      for(var i = 0; i< obj[keys].length; i++){
        //file.write(" ,"+ obj[keys][i].day + "," +obj[keys][i].date + "," + (obj[keys][i].logIn == "" ? "" : date.transform(obj[keys][i].logIn, 'HH:mm:ss', 'HH:mm')) + "," + (obj[keys][i].logOut == "" ? "": date.transform(obj[keys][i].logOut, 'HH:mm:ss', 'HH:mm')) + "," + (parseFloat(obj[keys][i].hours) > 8.83 ?  8.33 : obj[keys][i].hours) + "," + (parseFloat(obj[keys][i].hours) > 8.83 ? (parseFloat(obj[keys][i].hours) - 8.33).toFixed(2) : 0) + "\n"); //----(parseFloat(obj[keys][i].hours) > 8.83 ? Math.floor((parseFloat(obj[keys][i].hours) - 8.33)).toFixed(0) : 0)
        obj[keys][i].tiffen = calcTiffen(obj[keys][i].ot_hours,e.g);
        if(obj[keys][i].day == "Sun" && obj[keys][i].logIn == ''){
          file.write(" ,"+ obj[keys][i].day + "," +obj[keys][i].date + "," +"Weekly Off"+ "\n");
        }
        else{
          file.write(" ,"+ obj[keys][i].day + "," +obj[keys][i].date + "," + (obj[keys][i].logIn == "" ? "" : date.transform(obj[keys][i].logIn, 'HH:mm:ss', 'HH:mm')) + ","+ (obj[keys][i].late_hours > 0 ? floatToTime(obj[keys][i].late_hours):"") + "," + (obj[keys][i].logOut == "" ? "": date.transform(obj[keys][i].logOut, 'HH:mm:ss', 'HH:mm')) + "," + formatTime(workingHours(obj[keys][i].hours)) + "," +calcWorkDay(obj[keys][i].hours, obj[keys][i].logIn) + "," + floatToTime(obj[keys][i].ot_hours)+","+ obj[keys][i].tiffen + "\n");
        }
        
      }
      
      file.write(",,,Total,"+cal_late_hours(obj[keys])+",,,"+ w_days(obj[keys])+","+ cal_ot_days(obj[keys])+","+cal_total_tiffen(obj[keys])+"\n");
    }
    file.end();
    file.on('finish', function(){
      console.log("File Write Completed");
    })
  }
  
/*Shift Timings
8.30 - Morning Punch-in
5.20 - Evening Punch-out

7.20 - Ladies First Shoft OT

8.20 - First Shift OT
11.20 - Second Shift OT
6.20 - Third Shift OT
*/
const getEmployee = (code) =>{
  /*emp_data.filter(function(data) {
    if(parseInt(data.e_code) == code){
      return data
     }  
    }
  )*/
  //array.find(obj => obj.name === 'John');
  return emp_data.find(obj => parseInt(obj.e_code) == code);
}
//data.find(item => item.field === 'match')
const calculateHours = (time1, time2) =>{
  var t_1 = date.transform(time1, 'HH:mm', 'hh:mm:ss A');
  var t_2 = date.transform(time2, 'HH:mm', 'hh:mm:ss A');
  var r = date.subtract(date.parse(t_1, 'hh:mm:ss A', true), date.parse(t_2, 'hh:mm:ss A', true)).toHours();
  return (r).toFixed(2)
}

const calculateOTHours = (hours, time1) =>{
  /*if(hours < 4){
    return parseFloat(hours)
  }
  else if(hours < 7.5){
    return parseFloat(hours - 4);
  }*/
  //else{
  if(hours > 4 || hours < 0){
    var t_1 = date.transform(time1,'HH:mm:ss','hh:mm:ss A');
    var t_2 = date.transform("17:50:00", 'HH:mm:ss', 'hh:mm:ss A');
    var r = date.subtract(date.parse(t_1, 'hh:mm:ss A', true), date.parse(t_2, 'hh:mm:ss A', true)).toHours();
    if(r > 0){
      //return roundHrs((r + 0.5).toFixed(2),0.5);
      return parseFloat((r + 0.5).toFixed(2))
    }
    else if(r < - 8){
      //6 hrs + 0.17 - 10 mins
      var t_f = date.transform("00:00:00", 'HH:mm:ss', 'hh:mm:ss A');
      var r_n = date.subtract(date.parse(t_1, 'hh:mm:ss A', true), date.parse(t_f, 'hh:mm:ss A', true)).toHours();
      return parseFloat((r_n + 0.5 + 6.17).toFixed(2))
      //console.log(r_n + 6.17);
      //console.log(time1);
    }
    else {
      return 0
    }
  }
  else{
    return 0
  }
  //}
}
const workingHours = (hours) =>{
  if(isNaN(hours)){
    return "";
  }
  else if(hours > 0){
    return hours;
  }
  else if(hours < 0){
    return 24 + parseFloat(hours);
  }
  else{
    return "";
  }
}

const calculateLateHours = (time1, day) =>{
  var t_1 = date.transform(time1,'HH:mm:ss','hh:mm:ss A');
  var t_2 = date.transform("08:30:00", 'HH:mm:ss', 'hh:mm:ss A');
  var r = date.subtract(date.parse(t_1, 'hh:mm:ss A', true), date.parse(t_2, 'hh:mm:ss A', true)).toHours();
  //console.log(day)
  if(day >= 1){
    if(r > 0){
      return parseFloat((r).toFixed(2));
    }
    else if(r <= 0){
      return 0;
    }
    else {
      return 0;
    }
  }
  else{
    return 0;
  }
  
}

const calcTiffen = (ot_hours, gender) =>{
  if(gender == 'MALE'){
    if(ot_hours >= 2 && ot_hours < 3){
      return 25;
    }
    if(ot_hours >= 3 && ot_hours < 6){
      return 35
    }
    else if(ot_hours >= 6 && ot_hours < 13){
      return 60;
    }
    else if(ot_hours >= 13){
      return 95;
    }
    else{
      return 0;
    }
  }
  else{
    if(ot_hours >= 2){
      return 25;
    }
    else{
      return 0
    }
  }
}

function floatToTime(float) {
  var hours = Math.floor(float);
  var minutes = Math.round((float - hours) * 60);
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  return hours + ":" + minutes;
}

const timeSlot = (time) => {
  var ts_1 = date.parse('08:00:00 AM', 'hh:mm:ss A', true);
  var ts_2 = date.parse('12:30:00 PM', 'hh:mm:ss A', true);
  var ts_3 = date.parse('02:00:00 PM', 'hh:mm:ss A', true);
  var ts_4 = date.parse('05:50:00 PM', 'hh:mm:ss A', true);

  var ts_5 = date.parse('08:30:00 PM', 'hh:mm:ss A', true);
  var ts_6 = date.parse('11:30:00 PM', 'hh:mm:ss A', true);
  
  var ts_7 = date.parse('12:00:00 AM', 'hh:mm:ss A', true);
  var ts_8 = date.parse('07:00:00 AM', 'hh:mm:ss A', true);

  var parsed = date.parse(time, 'hh:mm:ss A', true);

  if( parsed >= ts_1 && parsed < ts_2){
      return 1;
  }
  else if( parsed >= ts_2 && parsed < ts_3){
      return 2;
  }
  else if( parsed >= ts_3 && parsed < ts_4){
      return 3;
  }
  else if( parsed >= ts_4 && parsed < ts_5 ){
      return 4;
  }
  else if( parsed >= ts_5 && parsed < ts_6 ){
      return 5;
  }
  else if(parsed >= ts_7 && parsed < ts_8){
    return 6;
  }
};

const formatTime = (hours)=>{
  var decimalPart = hours % 1; // Extract the decimal part of the hours
  var minutes = Math.round(decimalPart * 60); // Convert decimal part to minutes
  var wholeHours = Math.floor(hours); // Get the whole number of hours
  var formattedTime = wholeHours + ":" + minutes.toString().padStart(2, "0"); // Format the time as "hours:minutes"
  return formattedTime;
}

const convertObj = (array) =>{

}

module.exports = processAtt;
/*//-----------TO-DOs---------------------------------------------//
* Add Late Hours Calculation
* Add Permission Hours Calculation
* Add Full Night Shift Calculation
* Add Consolidated Value at the end of each EId
* Add Lunch Timings as a seperate Sheet
----------------------------------------------------------------*/


//let json = csvToJson.fieldDelimiter(',').getJsonFromCsv(array);
//const dataInJSON = txtToJson({ filePath: "./ATT-Today.txt" });
//console.log(json);

/*const fs = require('fs');
const fileName = process.argv[2];
if(fileName){
const saveFileName = process.argv[3] || fileName.split('.txt')[0] + '.csv';
fs.readFile(fileName, 'utf8', (err, data) => {
  if(err) throw err;

  fs.writeFile(saveFileName, commaSeparate(data), 'utf8', (err) => {
   if(err) throw err;
    console.log('CSV exported');
  });

});
}

console.log('***** Error: Please rerun command with a file to convert.*****')
process.exitCode = 1;*/
