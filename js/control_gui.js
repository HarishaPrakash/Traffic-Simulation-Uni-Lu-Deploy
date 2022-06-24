//#############################################
// common GUI callbacks for the general control (buttons and sliders);
// actual start of sim thread in the main
// scenario file like ring.js, onramp.js
// common canvas-related callbacks (mouse, touch) in canvas_gui.js
//#############################################

// general helper function 
// (control_gui.js is one of the first js to be called)

function formd(x){return parseFloat(x).toFixed(2);}
function formd0(x){return parseFloat(x).toFixed(0);}

//################################################################
// Toggles for the display of road and vehicle IDs (triggered by "onclick")
//#################################################################

var drawRoadIDs=false;
var drawVehIDs=false;

function toggleRoadID(){
  if(drawRoadIDs){
    drawRoadIDs=false;
    document.getElementById("buttonRoadID").innerHTML="Show road IDs";
  }
  else{
    drawRoadIDs=true;
    document.getElementById("buttonRoadID").innerHTML="Do not show road IDs";
  }
}

function toggleVehID(){
  if(drawVehIDs){
    drawVehIDs=false;
    for(var ir=0; ir<network.length; ir++){network[ir].drawVehIDs=drawVehIDs;}

    document.getElementById("buttonVehID").innerHTML="Show vehicle IDs";
  }
  else{
    drawVehIDs=true;
    for(var ir=0; ir<network.length; ir++){network[ir].drawVehIDs=drawVehIDs;}
    document.getElementById("buttonVehID").innerHTML="Do not show vehicle IDs";
  }
}



//################################################################
// Start/Stop button action (triggered by "onclick" callback in html file)
//#################################################################

// in any case need first to stop;
// otherwise multiple processes after clicking 2 times start
// define no "var myRun "; otherwise new local instance started
// whenever myRun is inited

var isStopped=false; // only initialization

function myStartStopFunction(){ 

    clearInterval(myRun);
    //console.log("in myStartStopFunction: isStopped=",isStopped);

    //!!
    if(isStopped){
	isStopped=false;
	document.getElementById("startStop").src="figs/pause.png";
	myRun=setInterval(main_loop, 1000/fps);
    }
    else{
	document.getElementById("startStop").src="figs/start.png";
	isStopped=true;
    }
}

//################################################################
// Restart/reset the same simulation 
// (triggered by "onclick" callback in html file)
// all settings and GUI-moved objects unchanged
//#################################################################

function myRestartFunction(){ 
  time=0;
  itime=0;
  var i=0;

  for(var i=0; i<network.length; i++){

    var road=network[i];
    // remove all regular vehicles (leave obstacles and other special objects)
    // filter gives new array of filtered objects & leaves old unchanged
    // NOTICE: works with objects by reference, although locally created ("var")

    var newVehicles = road.veh.filter(selectNotRegularVeh);

    // add regular vehicles according to the given init density per lane

    road.veh=newVehicles;
    road.initRegularVehicles(density,fracTruck);
  }

  // reset all detectors (each detector knows which road it is at)

  if(!(typeof detectors === 'undefined')){
    for(var iDet=0; iDet<detectors.length; iDet++){
      detectors[iDet].reset();
    }
  }

   // activate thread if stopped

  if(isStopped){
    isStopped=false;
    document.getElementById("startStop").src="figs/pause.png";
    myRun=setInterval(main_loop, 1000/fps);
  }

}


// helper function for the filter in myRestartFunction
// (passed as func pointer) 

function selectNotRegularVeh(veh){
  return !veh.isRegularVeh();
}


//#########################################################
// gui-definition of type of intersection
// rightPrio is as 4wayStop but most complicated: no stop mandatory
//#########################################################


var intersectionType={0:"signalized",1:"priority",2:"4wayStop",3:"prioRight"};


function handleIntersectionType(index){
  intersectionIndex=index;
  console.log("in handleIntersectionType: index=",index,
	      " intersectionType=",intersectionType[index]);
}

// (and handleChangedOD from the rounabout section below)



//#########################################################
// give-way rules switch for roundabout
// (vars respectRingPrio, respectRightPrio)
//#########################################################


var respectRingPrio=true;
var respectRightPrio=false;


// roundabout: priority as a combobox (more options)
// first option has index 0 etc

function handleChangedPriority(index){
    respectRingPrio=(index==0);
    respectRightPrio=(index==1);
    console.log("in handleChangedPriority: index=",index,
		" respectRingPrio=",respectRingPrio,
		" respectRightPrio=",respectRightPrio);
}


// roundabout and intersections: change OD options
// options={straight,right,left,all}

function handleChangedOD(index){
    leftTurnBias=(index==1) ? -1 : (index==2) ? 1 : 0;
    focusFrac=(index<3) ? 1 : 0;
    console.log("in handleChangedOD: index=",index,
		" leftTurnBias=",leftTurnBias,
		" focusFrac=",focusFrac);
}



/*#########################################################
 general game callbacks (specific function at the game js)
#########################################################*/


/*#########################################################
 implement highscore list
#########################################################

enabled by html5 localStorage functionality
*/



function updateHighscores(nickName,newScore,storageName){

    // test if functionality is available at all

    if (typeof(Storage) === "undefined") {
	console.log("html5 localStorage is not available on your device");
	return;
    }

    // test if there are already data in this localStorage 
    // and get them, if applicable 

    var scores =[];
    if(localStorage[storageName]){
	scores = JSON.parse(localStorage[storageName]);
    }

    // add new entry to scores array

    var date=new Date();
    var year=date.getFullYear();
    var month=date.getMonth()+1; if(month<10){month="0"+month;}
    var day=date.getDate(); if(day<10){day="0"+day;}
    var hours=date.getHours(); if(hours<10){hours="0"+hours;}
    var minutes=date.getMinutes(); if(minutes<10){minutes="0"+minutes;}
    var seconds=date.getSeconds(); if(seconds<10){seconds="0"+seconds;}

    var dateStr=year+"-"+month+"-"+day
	+" "+hours+":"+minutes+":"+seconds;

    scores.push({name:nickName,
		 score:newScore,
		 date:dateStr
		});

  //console.log("before sorting: scores=",scores);
  scores.sort(function(a,b){return a.score - b.score}); // !! a-b, not a>b
  //console.log("after sorting: scores=",scores);

    // save the updated highscore list and return string for html display 

    localStorage[storageName] = JSON.stringify(scores);
 

    var str_highScores="<h1> Game Finished!</h1> Your time is "
	+newScore+" Seconds"
	+"<h2>Highscore list:</h2>"
	+"<table border=\"0\" cellspacing=\"1\" cellvisibilityExt=\"3\">"
	//+"<tr><th> name</th><th>score [s]</th><th>time</th></tr>";
	+"<tr><th>rank</th><th> name</th><th>score [s]</th></tr>";

    //for(var i=0; i<scores.length; i++){
    for(var i=0; i<Math.min(scores.length,10); i++){
	console.log("name:",scores[i].name,
		    " score:",scores[i].score,
		    " date:",scores[i].date);
	str_highScores += "<tr>"
            + "<td>"+(i+1)+"</td>"
            + "<td>"+scores[i].name+"</td>"
	    + "<td>"+scores[i].score+"</td>"
	   // + "<td>"+scores[i].date+"</td>"
            +  "</tr>"
    }
  str_highScores += "</table>";
  console.log("updateHighscores: storageName=",storageName,
	      "\n localStorage[storageName]=", localStorage[storageName],
	      "\n localStorage=",localStorage);
  return str_highScores;
}


// manually delete highscores from disk [loeschen remove]
// comment out in routing[Game].js if online!

function deleteHighscores(storageName){
  if (typeof(Storage) === "undefined") {
	console.log("html5 localStorage is not available on your device");
	return;
  }
  var scores =[];
  if(localStorage[storageName]){
	localStorage[storageName] = JSON.stringify(scores);
  }
  console.log("deleteHighscores: storageName=",storageName,
	      "\n localStorage[storageName]=", localStorage[storageName],
	      "\n localStorage=",localStorage);
}





/*#########################################################
 info button callback
#########################################################

jquery needed to fill div with external html (script in header)
$("#infotext") equals document.getElementById("infotext")
but document.getElementById("infotext").load("info_ring.html"); does not work
*/

var infoLevel=0;
var nLevels=6;
function showInfo(){ 
    var scenarioFile="info/info_"+scenarioString+".html";
    console.log("showInfo (control_gui): scenarioFile=",scenarioFile);


   // scenarioFile is dynamically determined 
   // e.g., "info/info_"+scenarioString+".html"

  //dos not work
  //if(infoLevel===0){document.getElementById("infotext").innerHTML="info/info_gui.html"}

  
    if(infoLevel===0){$("#infotext").load("info/info_gui.html");}
    else if(infoLevel===1){$("#infotext").load(scenarioFile);}
    else if(infoLevel===2){$("#infotext").load("info/info_IDM.html");}
    else if(infoLevel===3){$("#infotext").load("info/info_MOBIL.html");}
    else if(infoLevel===4){$("#infotext").load("info/info_BC.html");}
    else if(infoLevel===5){$("#infotext").load("info/info_Numerics.html");}
    infoLevel++; infoLevel=(infoLevel%nLevels);
}


// w/o scrollTo, the page is not shown at top, even with html#name mechanism!

//function showHTMLfile(htmlfile){
//    $("#infotext").load(htmlfile);$("#infotext").scrollTop(0);
//}

/*#########################################################
 lane add/subtract callbacks
#########################################################*/

var nLanesMin=1; // can be overridden in main sim files
var nLanesMax=4; 

function addOneLane(){ 
  if(mainroad.nLanes<nLanesMax){
	userCanvasManip=true; // causes drawing background, resampling road
	mainroad.addOneLane();     // changes mainroad.nLanes
	nLanes_main++;             // needed for defining geometry
	roadImg1=roadImgs1[mainroad.nLanes-1];
	roadImg2=roadImgs2[mainroad.nLanes-1];

  }



  
  else{console.log("addOneLane(): maximum of ",nLanesMax,
		     " lanes reached!");}

  console.log("addOneLane: mainroad.nLanes=",mainroad.nLanes);
  if(mainroad.nLanes===nLanesMax){
	document.getElementById("lanePlusDiv").style.visibility="hidden";
  }
  if(mainroad.nLanes>nLanesMin){
        document.getElementById("laneMinusDiv").style.visibility="visible";
  }
}
 


function subtractOneLane(){ 
  if(mainroad.nLanes>nLanesMin){
	userCanvasManip=true;  // causes drawing background, resampling road
	mainroad.subtractOneLane(); // changes mainroad.nLanes
	nLanes_main--;             // needed for defining geometry
	roadImg1=roadImgs1[mainroad.nLanes-1];
	roadImg2=roadImgs2[mainroad.nLanes-1];

  }


  
  else{console.log("subtractOneLane(): minimum of ",nLanesMax,
		     " lanes reached!");}

  //console.log("subtractOneLane: mainroad.nLanes=",mainroad.nLanes);

  if(mainroad.nLanes===nLanesMin){
	document.getElementById("laneMinusDiv").style.visibility="hidden";
  }
  if(mainroad.nLanes<nLanesMax){
	//console.log("in setting lanePlus visible!!!");
        document.getElementById("lanePlusDiv").style.visibility="visible";
  }

}



//#############################################
// callback of "enforce Overtaking Ban" button
//#############################################

var banIsActive=false; // only initialization
var banButtonClicked=false; // only initialization

function toggleTruckOvertakingBan(){
    banButtonClicked=true; // everything needs to be redrawn
    if(banIsActive){
	banIsActive=false;
	document.getElementById('overtakingBan').innerHTML
	    ="Enforce Truck Overtaking Ban";
   }
    else{
	banIsActive=true;
	document.getElementById('overtakingBan').innerHTML
	    ="Lift Truck Overtaking Ban";
    }
    updateModelsUphill();
    console.log("control_gui.toggleTruckOvertakingBan: LCModelTruckUphill=",
		LCModelTruckUphill);
 
}




//############################################################
// Slider for long Model parameters
//############################################################

// var defs such as var IDM_v0=30: initial default; slider values are 
// distributed in updateModels() and (as deep copies) 
// in road.updateModelsOfAllVehicles

// IDM_v0 slider

var IDM_v0=30; 
var slider_IDM_v0,slider_IDM_v0Val;
if(document.getElementById("slider_IDM_v0")!==null){
   slider_IDM_v0 = document.getElementById("slider_IDM_v0");
   slider_IDM_v0Val = document.getElementById("slider_IDM_v0Val");
   slider_IDM_v0.value=3.6*IDM_v0;
   slider_IDM_v0Val.innerHTML=3.6*IDM_v0+" km/h";
   slider_IDM_v0.oninput = function() {
       slider_IDM_v0Val.innerHTML = this.value+" km/h";
       IDM_v0=parseFloat(this.value)/3.6;
       updateModels();
   }
}


// IDM_T slider

var IDM_T=1.4; 
var slider_IDM_T,slider_IDM_TVal;
if(document.getElementById("slider_IDM_T")!==null){
   slider_IDM_T = document.getElementById("slider_IDM_T");
   slider_IDM_TVal = document.getElementById("slider_IDM_TVal");
   slider_IDM_T.value=IDM_T;
   slider_IDM_TVal.innerHTML=IDM_T+" s";
   slider_IDM_T.oninput = function() {
       slider_IDM_TVal.innerHTML = this.value+" s";
       IDM_T=parseFloat(this.value);
       updateModels();
   }
}



// IDM_s0 slider

var IDM_s0=2; 
var slider_IDM_s0,slider_IDM_s0Val;
if(document.getElementById("slider_IDM_s0")!==null){
   slider_IDM_s0 = document.getElementById("slider_IDM_s0");
   slider_IDM_s0Val = document.getElementById("slider_IDM_s0Val");
   slider_IDM_s0.value=IDM_s0;
   slider_IDM_s0Val.innerHTML=IDM_s0+" m";
   slider_IDM_s0.oninput = function() {
       slider_IDM_s0Val.innerHTML = this.value+" m";
       IDM_s0=parseFloat(this.value);
       updateModels();
   }
}



// IDM_a slider

var IDM_a=0.3; 
var slider_IDM_a,slider_IDM_aVal;
if(document.getElementById("slider_IDM_a")!==null){
    slider_IDM_a = document.getElementById("slider_IDM_a");
    slider_IDM_aVal = document.getElementById("slider_IDM_aVal");
    slider_IDM_a.value=IDM_a;
    slider_IDM_aVal.innerHTML=IDM_a+" m/s<sup>2</sup>";

    slider_IDM_a.oninput = function() {
        slider_IDM_aVal.innerHTML = this.value+" m/s<sup>2</sup>";
        IDM_a=parseFloat(this.value);
        updateModels();
    }
}

// IDM_b slider

var IDM_b=3; 
var slider_IDM_b,slider_IDM_bVal;
if(document.getElementById("slider_IDM_b")!==null){
    slider_IDM_b = document.getElementById("slider_IDM_b");
    slider_IDM_bVal = document.getElementById("slider_IDM_bVal");
    slider_IDM_b.value=IDM_b;
    slider_IDM_bVal.innerHTML=IDM_b+" m/s<sup>2</sup>";

    slider_IDM_b.oninput = function() {
        slider_IDM_bVal.innerHTML = this.value+" m/s<sup>2</sup>";
        IDM_b=parseFloat(this.value);
        updateModels();
    }
}


// speedlimit slider
// per default no speed limit (speedL used in updateModels())

var speedL=1000/3.6; 
var speedL_truck=80/3.6; // default truck speedlimit (no slider)

var slider_speedL, slider_speedLVal;
if(document.getElementById("slider_speedL")!==null){
    slider_speedL = document.getElementById("slider_speedL");
    slider_speedLVal = document.getElementById("slider_speedLVal");
    slider_speedL.value=3.6*speedL;
    slider_speedLVal.innerHTML=3.6*speedL+ " km/h";

    slider_speedL.oninput = function() {
        slider_speedLVal.innerHTML = this.value+" km/h";
        speedL=parseFloat(this.value/3.6);
        updateModels();
    }
}


// speed variance slider (various applications, e.g. acceleration noise
// or intermittent stops at the golf course)

var speedVar=0; // default; will be overridden if used
var slider_speedVar, slider_speedVarVal;
if(document.getElementById("slider_speedVar")!==null){
  slider_speedVar = document.getElementById("slider_speedVar");
  slider_speedVarVal = document.getElementById("slider_speedVarVal");
  slider_speedVar.value=speedVar;
  slider_speedVarVal.innerHTML=speedVar+ " (m/s)<sup>2</sup>";

  slider_speedVar.oninput = function() {
    slider_speedVarVal.innerHTML=this.value+" (m/s)<sup>2</sup>";
    speedVar=parseFloat(this.value);
    for (var i=0; i<ouProcess.length ; i++){
      ouProcess[i].A=IDM_a*Math.sqrt(speedVar)/IDM_v0;
    }
  }
}


// truck uphill steady-state maxSpeed slider

var IDM_v0Up=100/3.6; 
var slider_IDM_v0Up, slider_IDM_v0UpVal;
if(document.getElementById("slider_IDM_v0Up")!==null){
    slider_IDM_v0Up = document.getElementById("slider_IDM_v0Up");
    slider_IDM_v0UpVal = document.getElementById("slider_IDM_v0UpVal");
    slider_IDM_v0Up.value=3.6*IDM_v0Up;
    slider_IDM_v0UpVal.innerHTML=3.6*IDM_v0Up+ " km/h";

    slider_IDM_v0Up.oninput = function() {
        slider_IDM_v0UpVal.innerHTML = this.value+" km/h";
        IDM_v0Up=parseFloat(this.value/3.6);
        updateModels();
        updateModelsUphill();
    }
}




//############################################################
// Slider for MOBIL parameters
//############################################################

// MOBIL_bThr slider

var MOBIL_bThr=0.4; 
var slider_MOBIL_bThr,slider_MOBIL_bThrVal;
if(document.getElementById("slider_MOBIL_bThr")!==null){
    slider_MOBIL_bThr = document.getElementById("slider_MOBIL_bThr");
    slider_MOBIL_bThrVal = document.getElementById("slider_MOBIL_bThrVal");
    slider_MOBIL_bThr.value=MOBIL_bThr;
    slider_MOBIL_bThrVal.innerHTML=MOBIL_bThr+" m/s<sup>2</sup>";

    slider_MOBIL_bThr.oninput = function() {
        slider_MOBIL_bThrVal.innerHTML = this.value+" m/s<sup>2</sup>";
        MOBIL_bThr=parseFloat(this.value);
        updateModels();
    }
}

// MOBIL_bBiasRight_car slider

var MOBIL_bBiasRight_car=0.05; 
var slider_MOBIL_bBiasRight_car,slider_MOBIL_bBiasRight_carVal;
if(document.getElementById("slider_MOBIL_bBiasRight_car")!==null){
    slider_MOBIL_bBiasRight_car 
	= document.getElementById("slider_MOBIL_bBiasRight_car");
    slider_MOBIL_bBiasRight_carVal 
	= document.getElementById("slider_MOBIL_bBiasRight_carVal");
    slider_MOBIL_bBiasRight_car.value=MOBIL_bBiasRight_car;
    slider_MOBIL_bBiasRight_carVal.innerHTML
	=MOBIL_bBiasRight_car+" m/s<sup>2</sup>";

    slider_MOBIL_bBiasRight_car.oninput = function() {
        slider_MOBIL_bBiasRight_carVal.innerHTML = this.value+" m/s<sup>2</sup>";
        MOBIL_bBiasRight_car=parseFloat(this.value);
        updateModels();
    }
}

// MOBIL_bBiasRight_truck slider

var MOBIL_bBiasRight_truck=0.2; 
var slider_MOBIL_bBiasRight_truck,slider_MOBIL_bBiasRight_truckVal;
if(document.getElementById("slider_MOBIL_bBiasRight_truck")!==null){
    slider_MOBIL_bBiasRight_truck 
	=document.getElementById("slider_MOBIL_bBiasRight_truck");
    slider_MOBIL_bBiasRight_truckVal
	=document.getElementById("slider_MOBIL_bBiasRight_truckVal");
    slider_MOBIL_bBiasRight_truck.value=MOBIL_bBiasRight_truck;
    slider_MOBIL_bBiasRight_truckVal.innerHTML
	=MOBIL_bBiasRight_truck+" m/s<sup>2</sup>";

    slider_MOBIL_bBiasRight_truck.oninput = function() {
        slider_MOBIL_bBiasRight_truckVal.innerHTML = this.value+" m/s<sup>2</sup>";
        MOBIL_bBiasRight_truck=parseFloat(this.value);
        updateModels();
    }
}


// MOBIL_p slider politeness factor

var MOBIL_p=0.1; 
var slider_MOBIL_p,slider_MOBIL_pVal;
if(document.getElementById("slider_MOBIL_p")!==null){
    slider_MOBIL_p 
	=document.getElementById("slider_MOBIL_p");
    slider_MOBIL_pVal
	=document.getElementById("slider_MOBIL_pVal");
    slider_MOBIL_p.value=MOBIL_p;
    slider_MOBIL_pVal.innerHTML
	=MOBIL_p+" m/s<sup>2</sup>";

    slider_MOBIL_p.oninput = function() {
        slider_MOBIL_pVal.innerHTML = this.value+" m/s<sup>2</sup>";
        MOBIL_p=parseFloat(this.value);
        updateModels();
    }
}

//#########################################################
// generic model declarations and fixed parameters w/o sliders
// control_gui.js called before <scenario>.js, therefore here
//#########################################################

var longModelCar;
var longModelTruck;
var LCModelCar;
var LCModelTruck;
var LCModelMandatory; // left-right discrim in road.updateModelsOfAllVehicles

var longModelCarUphill;
var longModelTruckUphill;
var LCModelCarUphill;
var LCModelTruckUphill;

// fixed model parameters w/o sliders


var MOBIL_bSafe=4;     // bSafe if v to v0  (threshold, bias in sliders)
var MOBIL_bSafeMax=17; // bSafe if v to 0 //!! use it

var MOBIL_mandat_bSafe=50; // *mandat for addtl LCModelMandatoryRight/Left
var MOBIL_mandat_bThr=0;   // to be specified below
var MOBIL_mandat_p=0;
var MOBIL_mandat_bias=42;

// define truck longModel as f(car longModel) v0 limited by speed limit

var factor_v0_truck=1; 
var factor_a_truck=1.0;
var factor_T_truck=1.1;


// creates template models from the preset IDM_v0, IDM_a etc values
// (2019-09)
// these are now distributed by deep copy over the vehicles of the roads

function updateModels(){
    var v0=Math.min(IDM_v0, speedL);
    var v0_truck=Math.min(IDM_v0, speedL_truck);
    var T_truck=factor_T_truck*IDM_T;
    var a_truck=factor_a_truck*IDM_a;
    longModelCar=new ACC(v0,IDM_T,IDM_s0,IDM_a,IDM_b);
    longModelCar.speedlimit=speedL;
    longModelTruck=new ACC(v0_truck,T_truck,IDM_s0,a_truck,IDM_b);
    longModelTruck.speedlimit=Math.min(speedL, speedL_truck);
    LCModelCar=new MOBIL(MOBIL_bSafe, MOBIL_bSafeMax, MOBIL_p,
                        MOBIL_bThr, MOBIL_bBiasRight_car);
 
    LCModelTruck=new MOBIL(MOBIL_bSafe, MOBIL_bSafeMax, MOBIL_p,
			   MOBIL_bThr, MOBIL_bBiasRight_truck);
    LCModelMandatory=new MOBIL(MOBIL_mandat_bSafe, MOBIL_mandat_bSafe, 
			       MOBIL_mandat_p,
			       MOBIL_mandat_bThr, MOBIL_mandat_bias);

  console.log("control_gui.updateModels:",
	      " longModelTruck.speedlimit=",longModelTruck.speedlimit);


}



function updateModelsUphill(){

    // uphill section (no overtaking ban by default)

    var T_truck=factor_T_truck*IDM_T;
    var a_truck=factor_a_truck*IDM_a;

    longModelCarUphill=longModelCar;
    longModelTruckUphill=new ACC(IDM_v0Up,T_truck,IDM_s0,a_truck,IDM_b);
    LCModelCarUphill=LCModelCar;
    LCModelTruckUphill=(banIsActive) ? LCModelMandatory : LCModelTruck;
    //console.log("control_gui.updateModelsUphill: LCModelTruckUphill=",
//		LCModelTruckUphill);
}

// example for changing sliders from standard init setting in gui
/*
IDM_T=0.5; 
slider_IDM_T.value=IDM_T;
slider_IDM_TVal.innerHTML=IDM_T+" s";
*/






//################################################################
// Start/Finish Download button callback and performDownload
// see also ~/versionedProjects/demo_js/writeFileDemo.html, .js
//#################################################################

var downloadActive=false; // initialisation
var dt_export=1;          // every dt_export seconds stored in exportString

function downloadCallback(){
  if(downloadActive){
    performDownload();
    downloadActive=false;
    document.getElementById("download").src="figs/iconDownloadStart_small.png";
  }
  
  else{ // title/header lines
    for(var i=0; i<network.length; i++){
      network[i].exportString
        ="#time\tid\tx[m]\ty[m]\tspeed[m/s]\theading\tacc[m/s^2]";
    }

    if(typeof detectors!=="undefined"){
      for (var iDet=0; iDet<detectors.length; iDet++){
        var det=detectors[iDet];
        console.log("det=",det);
        det.exportString="#Detector "+iDet
 	  +" at road "+det.road.roadID+" at position x="+det.u.toFixed(0)
	  + " aggregation time [s]="+det.dtAggr
	  +"\n#time[s]\tflow[veh/h]\tspeed[km/h]";
      }
    }
    downloadActive=true;
    document.getElementById("download").src="figs/iconDownloadFinish_small.png";
  }
}


function performDownload(){
  var msg="";
  for(var i=0; i<network.length; i++){
    var filename="road"+network[i].roadID+"_time"+time.toFixed(1)+".txt";
    msg=msg+filename+" ";
    network[i].writeVehiclesSimpleToFile(filename);
  }
  if(typeof detectors!=="undefined"){
    for (var iDet=0; iDet<detectors.length; iDet++){
      var filename="Detector"+iDet
        +"_road"+detectors[iDet].road.roadID
        +"_x"+detectors[iDet].u.toFixed(0)+"_time"+time.toFixed(0)+".txt";
      msg=msg+filename+" ";
      detectors[iDet].writeToFile(filename);
    }
  }

  msg="wrote files "+msg+" to default folder (Downloads)";
  downloadActive=false;
  alert(msg);
}



//######################################################################
// write (JSON or normal) string to file (automatically in download folder)
//######################################################################
  
function download(data, filename) {
    // data is the string type, that contains the contents of the file.
    // filename is the default file name, some browsers allow the user to change this during the save dialog.

    // Note that we use octet/stream as the mimetype
    // this is to prevent some browsers from displaying the 
    // contents in another browser tab instead of downloading the file
    var blob = new Blob([data], {type:'octet/stream'});

    //IE 10+
    if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        //Everything else
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.download = filename;

        setTimeout(() => {
            //setTimeout hack is required for older versions of Safari

            a.click();

            //Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 1);
    }
}
