import React from 'react';
import Classnames from 'classnames';
import Got from 'got';

export class Microphone extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isActive: false
    };

    this.listen = this.listen.bind(this);
  }

  speak(msg, voice = 'Alex') {
    // let utterance = new SpeechSynthesisUtterance(msg);
    // speechSynthesis.speak(utterance);
    // utterance.onend = () => {
    //   speechSynthesis.cancel();
    //   this.listen();
    // };
    let utterance = new SpeechSynthesisUtterance(msg);
    utterance.voice = speechSynthesis.getVoices().filter(voiceAvailiable => { return voiceAvailiable.name == voice; })[0];
    speechSynthesis.speak(utterance);
  }

  listen() {
    if (this.state.isActive) {
      this.recognition.stop();
      return;
    }

    if ( !('webkitSpeechRecognition' in window) ) {
      console.log('speech recognition is not availiable!');
    } else {
      this.recognition = new webkitSpeechRecognition();
      // this.recognition.continuous = true;
      // this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.setState({isActive: true});
        console.log('listening...');
      }

      this.recognition.onresult = (event) => { 
        var interimTranscript = '';
        var finalTranscript = '';

        if (typeof(event.results) == 'undefined') {
          recognition.onend = null;
          recognition.stop();
          return;
        }

        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        console.log(finalTranscript);

        let body = {
          text: finalTranscript
        };

        Got('/api/talkToRobot', {
          credentials: 'include',
          method: 'POST',
          encoding: 'utf8',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
        .then((res) => {
          let reply = res.body;
          console.log(`reply: ${reply}`);

          this.speak(reply, 'Milena');
        });
      }

      this.recognition.onerror = (err) => {
        console.log(err);
      }

      this.recognition.onend = () => {
        this.setState({isActive: false});
        console.log('stoped listening.');
      }

      this.recognition.start();
    }
  }

  render() {
    let micIconClass = Classnames({
      'micIcon': true,
      'isActive': this.state.isActive
    });

    return(
      <div className="dashboardItem dashboardItem--interactive" onClick={this.listen} title="turn speach recognition on/off">
        <div className="dashboardItemInner">
          <div className="dashboardItemBlock">
            <svg viewBox="0 0 38 73" className={micIconClass}>
              <g>
                <path d="M19,48.29753 C25.2349231,48.29753 30.2896538,43.24812 30.2896538,37.01976 L30.2896538,11.46027 C30.2896538,5.23191 25.2349231,0.1825 19,0.1825 C12.7650769,0.1825 7.71034615,5.23191 7.71034615,11.46027 L7.71034615,37.01976 C7.71034615,43.24812 12.7650769,48.29753 19,48.29753 L19,48.29753 Z"></path>
                <path d="M35.8478846,27.65313 C34.5683077,27.65313 33.5313462,28.68827 33.5313462,29.96577 L33.5313462,37.01976 C33.5313462,45.02348 27.0128846,51.53581 19,51.53581 C10.9863846,51.53581 4.46792308,45.02348 4.46792308,37.01976 L4.46792308,29.96577 C4.46792308,28.68827 3.43169231,27.65313 2.15284615,27.65313 C0.874,27.65313 -0.162961538,28.68827 -0.162961538,29.96577 L-0.162961538,37.01976 C-0.162961538,47.57483 8.43380769,56.16255 19,56.16255 C29.5661923,56.16255 38.1629615,47.57483 38.1629615,37.01976 L38.1629615,29.96577 C38.1629615,28.68827 37.1267308,27.65313 35.8478846,27.65313 L35.8478846,27.65313 Z"></path>
                <path d="M28.5511538,68.19076 L21.3150769,68.19076 L21.3150769,57.8598 C20.5543462,57.95178 19.7848462,58.0131 19,58.0131 C18.2144231,58.0131 17.4449231,57.95178 16.6841923,57.8598 L16.6841923,68.19076 L9.44884615,68.19076 C8.17,68.19076 7.13376923,69.22663 7.13376923,70.50413 L7.13376923,72.8175 L30.8669615,72.8175 L30.8669615,70.50413 C30.8662308,69.22663 29.83,68.19076 28.5511538,68.19076 L28.5511538,68.19076 Z"></path>
              </g>
            </svg>
          </div>
        </div>
      </div>
    );
  }
}
