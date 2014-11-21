#include <SPI.h>
#include <Ethernet.h>

// Enter a MAC address and IP address for your controller below.
// The IP address will be dependent on your local network:
byte mac[] = {
  0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192,168,1,5);
char removeServer[] = "example.com";
int removeServerPort = 80;
int pinLed = 7;
int pinMovement = 6;
int pinPump = 5;
int pinRelay = 4;

// Initialize the Ethernet server library
EthernetServer server(45);
// Initialize the Ethernet client library
EthernetClient client;

byte rip[] = {0,0,0,0};
float temp;
boolean isLedOn = false;
boolean isMovement = false;
boolean isRelayOn = false;
String readString;
long lastMovement;

void setup() {
  // open serial communications and wait for port to open:
  Serial.begin(9600);
  // set LED to the pin from led variable
  pinMode(pinLed, OUTPUT);
  pinMode(pinMovement, INPUT);
  pinMode(pinPump, OUTPUT);
  pinMode(pinRelay, OUTPUT);

  // start the Ethernet connection and the server:
  Ethernet.begin(mac, ip);
  server.begin();
  Serial.print("server is at ");
  Serial.println(Ethernet.localIP());
}

void getCurrentTemperature() {
  int analogTemp;
  // Read analog port
  analogTemp = analogRead(A0);
  // Math magic to convert resistance and voltage into temperature
  // And then convert Kelvin to Celsius
  temp = log(((10240000/analogTemp) - 10000));
  temp = 1 / (0.001129148 + (0.000234125 + (0.0000000876741 * temp * temp ))* temp );
  temp = temp - 273.15;
}

boolean getMovement() {
   long now = millis() / 1000;

   if (digitalRead(pinMovement) == HIGH && (now - lastMovement) > 8) {
     lastMovement = now;
     isMovement = true;
     Serial.println("Movement");
   } else {
     isMovement = false;
   }
}

void loop() {
  getCurrentTemperature();
  getMovement();

  // listen for incoming clients
  EthernetClient client = server.available();

  if (isMovement) {
    sendGET();
  }

  if (client) {
    Serial.println("new client");

    client.getRemoteIP(rip);
    for (int bcount= 0; bcount < 4; bcount++)
     {
        Serial.print(rip[bcount], DEC);
        if (bcount<3) Serial.print(".");
     }

    // an http request ends with a blank line
    boolean currentLineIsBlank = true;

    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        // read and store HTTP request char by char
        if (readString.length() < 100) {
          readString += c;
        }

        // end of the line (newline char) and the line is blank —
        // the http request has ended — time for a reply
        if (c == '\n' && currentLineIsBlank) {

          // do something, if a command has been received

          // send a standard http response header

          client.println("HTTP/1.1 200 OK");
          client.println("Access-Control-Allow-Origin: *");
          client.println();

          if (readString.indexOf("?data") > 0) {
            // output JSON with sensor data
            // (JSON with Arduino, it's going to be a bumpy ride!
            // http://www.youtube.com/watch?v=w8HZlWxtrfg)
            client.println("{");

            client.print("\"temp\"");
            client.print(": \"");
            client.print(temp);
            client.print("\"");
            client.print(",");

            client.println("");
            client.print("\"light\"");
            client.print(": \"");
            client.print(isLedOn);
            client.print("\"");
            client.print(",");

            client.println("");
            client.print("\"relay\"");
            client.print(": \"");
            client.print(isRelayOn);
            client.print("\"");

            client.println("}");
          }

          if (readString.indexOf("?ledON") > 0) {
            Serial.println("Led ON");
            digitalWrite(pinLed, HIGH);
            isLedOn = true;
          }

          if (readString.indexOf("?ledOFF") > 0) {
            Serial.println("Led OFF");
            digitalWrite(pinLed, LOW);
            isLedOn = false;
          }

          if (readString.indexOf("?relayON") > 0) {
            Serial.println("pump ON");
            digitalWrite(pinRelay, HIGH);
            isRelayOn = true;
          }

          if (readString.indexOf("?relayOFF") > 0) {
            Serial.println("pump OFF");
            digitalWrite(pinRelay, LOW);
            isRelayOn = false;
          }


          if (readString.indexOf("?get") > 0) {
            Serial.println("Send GET");
            sendGET();
          }

          break;
        }
        if (c == '\n') {
          // you're starting a new line
          currentLineIsBlank = true;
        }
        else if (c != '\r') {
          // you've gotten a character on the current line
          currentLineIsBlank = false;
        }
      }
    }

    // give the web browser time to receive the data
    // then close the connection
    delay(1);
    client.stop();
    Serial.println("client disonnected");

    // empty readString
    readString = "";
  }
}

// client function to send/receive GET request data
void sendGET() {
  if (client.connect(removeServer, removeServerPort)) {
    Serial.println("connected");
    client.println("GET /movement-alert HTTP/1.0");
    client.println("Host: example:80");
    client.println("Connection: close");
    client.println();
  } else {
    Serial.println("connection failed");
    Serial.println();
  }

//  while(client.connected() && !client.available()) delay(1); //waits for data
//  while (client.connected() || client.available()) { //connected or data available
//    char c = client.read();
//    Serial.print(c);
//  }

  Serial.println();
  Serial.println("disconnecting");
  Serial.println();
  delay(100);
  client.stop();
}
