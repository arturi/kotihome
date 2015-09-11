// analog pins
int tempPin = A5;
int luxPin = A4;

// digital pins
int lightPin = 8;
int motionPin = 5;

// variables
String inputString = ""; // a string to hold incoming data
boolean stringComplete = false;
boolean lightIsON = false;
long lastMovement;

// setup
void setup() {
  pinMode(tempPin, INPUT);
  pinMode(luxPin, INPUT);
  pinMode(lightPin, OUTPUT);
  pinMode(motionPin, INPUT);
  
//  inputString.reserve(200);
  Serial.begin(9600);
}

// main loop
void loop() {

    Serial.println("");
    Serial.print("{");
    Serial.print("\"temp\": ");
    Serial.print(getTemp());
    Serial.print(",");
    
    Serial.print("\"lux\": ");
    Serial.print(getLux());
    Serial.print(",");
    
    Serial.print("\"motion\": ");
    Serial.print(getMotion());
    Serial.print(",");
    
    Serial.print("\"lightIsOn\": ");
    Serial.print(lightIsON);
    
    Serial.print("}");

    //Serial.println("");
    
    if (stringComplete) {
      action(inputString);
      // clear the string:
      inputString = "";
      stringComplete = false;
    }
    
    delay(1000);
    
}

// take action based on the command from Serialport 
void action(String str) {
//  Serial.println(str);

  if (str == "lightSwitch\n") {
    lightSwitch();
  } else if (str == "lightOFF\n") {
    
  }

}

// get and return current temperature
int getTemp() {
  float temp;
  int analogTemp;
  analogTemp = analogRead(tempPin);
  
  // Math magic to convert resistance and voltage into temperature,
  // and then convert  to Celsius
  temp = log(((10240000/analogTemp) - 10000));
  temp = 1 / (0.001129148 + (0.000234125 + (0.0000000876741 * temp * temp ))* temp );
  temp = temp - 273.15;
  return temp;
}

// get and return current light
int getLux() {
  return analogRead(luxPin);
}

// turn light on/off
boolean lightSwitch() {
  if (!lightIsON) {
    digitalWrite(lightPin, HIGH);
    lightIsON = true;
  } else {
    digitalWrite(lightPin, LOW);
    lightIsON = false;
  }
  return lightIsON;
}

// get and return motion
boolean getMotion() {
   long now = millis() / 1000;

   if (digitalRead(motionPin) == HIGH && (now - lastMovement) > 6) {
     lastMovement = now;
     return true;
   } else {
     return false;
   }
}

// handle the Serialport communication
void serialEvent() {
  while (Serial.available()) {
    
    // get the new byte, then add it to the inputString:
    char inChar = (char)Serial.read();
    inputString += inChar;
    
    // if the incoming character is a newline, set a flag
    // so the main loop can do something about it:
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
}