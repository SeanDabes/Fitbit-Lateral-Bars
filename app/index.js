import clock from "clock";
import * as document from "document";
import { preferences } from "user-settings";
import * as util from "../common/utils";
import {battery} from "power";
import { today, goals } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import { BodyPresenceSensor } from "body-presence";
import { me as appbit } from "appbit";
import { user } from "user-profile";
import * as messaging from "messaging";

// Update the clock every second
clock.granularity = "seconds";

const mainClockHours = document.getElementById("ClockLabelHours");
const mainClockMinutes = document.getElementById("ClockLabelMinutes");
const mainDate = document.getElementById("Date");
const mainSeconds = document.getElementById("ClockSecondsLabel");
const batteryLevelText = document.getElementById("BatteryLabel");
const batteryLevelGauge = document.getElementById("BatteryGauge");
const BatteryIcon = document.getElementById("BatteryIcon");
const StepsText = document.getElementById("StepsText");
const StepsProgress = document.getElementById("StepsBar");
const DistanceText = document.getElementById("DistanceText");
const DistanceProgress = document.getElementById("DistanceBar");
const CaloriesText = document.getElementById("CaloriesText");
const CaloriesProgress = document.getElementById("CaloriesBar");
const ZonesText = document.getElementById("ZonesText");
const ZonesProgress = document.getElementById("ZonesBar");
const ElevationText = document.getElementById("ElevationText");
const ElevationProgress = document.getElementById("ElevationBar");
const HRText = document.getElementById("HRText");
const HRProgress = document.getElementById("HRBar");

const body = new BodyPresenceSensor();
const heart_rate = new HeartRateSensor();
const HRrestBar = document.getElementById("HRrestBar");
const HRfatburnBar = document.getElementById("HRfatburnBar");
const HRcardioBar = document.getElementById("HRcardioBar");
const HRpeakBar = document.getElementById("HRpeakBar");

body.start();

if (appbit.permissions.granted("access_heart_rate")) {
  if (!body.present) {
      heart_rate.stop();
      no_heart_rate();
    } 
  else {
      heart_rate.start();
    }
}
else {
  no_heart_rate();
}

heart_rate.addEventListener("reading", () => {
  update_heart_rate(heart_rate);
});

// Update all elements every tick with the current time
clock.ontick = (evt) => {
  update_clock(evt);
  //update_battery(evt);
  update_steps(evt);
  update_distance(evt);
  update_calories(evt);
  update_activezones(evt);
  update_elevation(evt);
}

body.addEventListener("reading", () => {
  if (appbit.permissions.granted("access_heart_rate")) {
    if (!body.present) {
      heart_rate.stop();
      no_heart_rate();
    } else {
      heart_rate.start();
    }
  }
  else {
    no_heart_rate();
  }
});

function update_clock(evt) {
  let today = evt.date;
  let hours = today.getHours();
  let seconds = util.zeroPad(today.getSeconds());
  let day = today.getDate();
  const daysweek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date();
  let month = months[d.getMonth()];
  let dayweek = daysweek[d.getDay()];
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  let mins = util.zeroPad(today.getMinutes());
  mainClockHours.text = `${util.monoDigits(hours)}`;
  mainClockMinutes.text = `${util.monoDigits(mins)}`;
  mainSeconds.text = `${util.monoDigits(seconds)}`;
  mainDate.text = `${dayweek} ${day} ${month}`;
}

//Initialize battery level and create function to update battery
//as the battery level changes
batteryLevelText.text = `${battery.chargeLevel}%`;

//function update_battery(evt){
  battery.onchange = (charger, evt) => {
    batteryLevelText.text = `${battery.chargeLevel}%`;
    batteryLevelGauge.width = Math.floor((175*battery.chargeLevel)/100);
    if (battery.chargeLevel > 40) {
      batteryLevelGauge.style.fill = 'limegreen';
      //BatteryIcon.style.fill = 'limegreen';
    }
    if (battery.chargeLevel < 40) {
      batteryLevelGauge.style.fill = 'orange';
      //BatteryIcon.style.fill = 'orange';      
    }
    if (battery.chargeLevel < 20) {
      batteryLevelGauge.style.fill = 'red';
      //BatteryIcon.style.fill = 'red';
    }
  }
//}
  
function update_steps(evt){
  StepsText.text = today.adjusted.steps;
  if (today.adjusted.steps >= goals.steps) {
    StepsProgress.width = 100;
  } else {
    StepsProgress.width = Math.floor((100*today.adjusted.steps)/goals.steps);
    //StepsProgress.width = 100;
    console.log = goals.steps;
  }
}

function update_distance(evt) {
  DistanceText.text = today.adjusted.distance;
  if (today.adjusted.distance >= goals.distance) {
    DistanceProgress.width = 100;
  } else {
    DistanceProgress.width = Math.floor((100*today.adjusted.distance)/goals.distance);
  }
}

function update_calories(evt) {
  CaloriesText.text = today.adjusted.calories;
  if (today.adjusted.calories >= goals.calories) {
    CaloriesProgress.width = 100;
  } else {
    CaloriesProgress.width = Math.floor((100*today.adjusted.calories)/goals.calories);
  }
}

function update_activezones(evt) {
  ZonesText.text = today.adjusted.activeZoneMinutes.total;
  if (today.adjusted.activeZoneMinutes.total >= goals.activeZoneMinutes.total) {
    ZonesProgress.width = 100;
  } else {
    ZonesProgress.width = Math.floor((100*today.adjusted.activeZoneMinutes.total)/goals.activeZoneMinutes.total);
  }
}

function update_elevation(evt) {
  ElevationText.text = today.adjusted.elevationGain;
  if (today.adjusted.elevationGain >= goals.elevationGain) {
    ElevationProgress.width = 100;
  } else {
    ElevationProgress.width = Math.floor((100*today.adjusted.elevationGain)/goals.elevationGain);
  }
}

function update_heart_rate(heart_rate) {
  HRText.text = heart_rate.heartRate;
  if (user.heartRateZone(heart_rate.heartRate) == "out-of-range") { //resting
    HRrestBar.style.opacity = 1;
    HRfatburnBar.style.opacity = 0.4;
    HRcardioBar.style.opacity = 0.4;
    HRpeakBar.style.opacity = 0.4;
  }
  else if (user.heartRateZone(heart_rate.heartRate) == "fat-burn") { //fat burn
    HRrestBar.style.opacity = 1;
    HRfatburnBar.style.opacity = 1;
    HRcardioBar.style.opacity = 0.4;
    HRpeakBar.style.opacity = 0.4;
  }
  else if (user.heartRateZone(heart_rate.heartRate) == "cardio") { //cardio
    HRrestBar.style.opacity = 1;
    HRfatburnBar.style.opacity = 1;
    HRcardioBar.style.opacity = 1;
    HRpeakBar.style.opacity = 0.4;
  }
  else if (user.heartRateZone(heart_rate.heartRate) == "peak") { // peak
    HRrestBar.style.opacity = 1;
    HRfatburnBar.style.opacity = 1;
    HRcardioBar.style.opacity = 1;
    HRpeakBar.style.opacity = 1;
  }
}

function no_heart_rate() {
  HRText.text = "--";
}
