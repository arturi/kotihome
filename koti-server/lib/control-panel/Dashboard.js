import React from 'react';
import { Colors } from './Colors';
import { LightBtn } from './LightBtn';
import { TempMeter } from './TempMeter';
import { LuxMeter } from './LuxMeter';
import { Motion } from './Motion';
import { Microphone } from './Microphone';
// import Got from 'got';

export class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      temp: 0,
      lightIsOn: 0,
      lux: 0,
      lastMotion: 0,
      bgColor: Colors.coral
    };

    this.socket = io();
    this.socket.on('status', data => {
      // console.log(data);
      this.setState({
        temp: data.temp || 0,
        lux: data.lux || 0,
        lightIsOn: data.lightIsOn || 0,
        lastMotion: data.lastMotion || 0
      });
    });

    // this.getData = this.getData.bind(this);

    // this.getData();
    // this.interval = setInterval(() => this.getData(), 1000);
  }

  // getData() {
  //   fetch('/data', {credentials: 'include'})
  //     .then(response => response.json())
  //     .then((data) => {
  //       // console.log(data);
  //       this.setState({
  //         temp: data.temp,
  //         lux: data.lux,
  //         lightIsOn: data.lightIsOn,
  //         lastMotion: data.lastMotion || 0
  //       });
  //     });
  // }

  render() {
    return (
      <div className="dashboard" style={{backgroundColor: this.state.bgColor}}>
        <div className="dashboardInner">
          <LightBtn lightIsOn={this.state.lightIsOn} />
          <TempMeter temp={this.state.temp} />
          <LuxMeter lux={this.state.lux} />
          <Motion lastMotion={this.state.lastMotion} />
          <Microphone />
        </div>
      </div>
    );
  }
}


