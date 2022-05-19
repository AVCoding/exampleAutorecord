
  var randomPeerId  =  Math.random().toString(36).substr(2, 9);
  const peer = new Peer( randomPeerId , {
    host: '213.226.114.12',
    // host: 'localhost',
    port: 9000,
    path: '/'
    // alive_timeout: 1000
  });
  var currentCall = {};
  var  myID;


  var mediaRecorder;
  var mediaArr = {};

  var pc ;
  // Call
  peer.on("open", function (id) {
      document.getElementById("uuid").textContent = id;
      myID = id;

      $(document).on('click','.autorecOn', function(){
          alert('autorec started');

          var callerId;

          // Start call
          const peerId = document.querySelector("input").value;
          pc = peer.connect(peerId);
        
          var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
          getUserMedia({video: true, audio: true}, function(stream) {
            const call = peer.call(peerId, stream);
            
            currentCall[peer.id] = call;
            console.log('currentCall');
            console.log(currentCall);

            var callerVideo = document.createElement('video');

            call.on('stream', function(remoteStream) {

                if( document.querySelector("#videoCaller-" + peer.id) != null) {
                  document.querySelector("#videoCaller-" + peer.id).remove(); 
                }
               
                document.getElementById("video-list").appendChild(callerVideo).setAttribute("id", "videoCaller-" + peer.id );
                callerId = peer.id;
                callerVideo.srcObject = stream;
                
                callerVideo.load();
                setTimeout(function() {
                  callerVideo.play();
                }, 0);

            });
          });
       
          peer.on('close', function(){
            alert('Peer on close (Start call)');
            document.getElementById("videoCaller-" + callerId).remove();
            peer.destroy();
          });
      // =======
      });
   // =======
  });

  $(document).on('click','.autorecOff', function(){
    alert('autorec OFF');
    if (myID != undefined) {
      pc.send(myID);
      if (document.querySelector("#videoCaller-" + myID) != null) {
        document.querySelector("#videoCaller-" + myID).remove();
      }
    }
  });

  peer.on('error', function(){
    alert('Peer on error  (internet included) myID - ' + myID);
    if (document.querySelector("#videoCaller-" + myID)) {
      document.querySelector("#videoCaller-" + myID).remove();
    }
  });

  peer.on('disconnected', function(){
    alert('Peer on Disconnected');
  });


 // Answer call status
  peer.on('connection', function(conn) {
    peer.on('close', function(){
        alert('Peer on close (Answer) ');
    });
    conn.on('data', function(data){
      if (data == conn.peer ) {
        alert('Conn on data ( (Answer) data recieved) ');
        videoRecOff(conn.peer);
      }
    });
    conn.on('close', function(el){
      alert('Conn on close  (Answer)');
    });   
    conn.on('disconnected', function(){
      alert('Conn disconnected (Answer)');
    });
    conn.on('error', function(){
      alert('Conn on error:  server not available (Answer)');
    });
  });

  // Answer
  peer.on("call", (call) => {
    // if (confirm(`Accept call from ${call.peer}?`)) {
      // grab the camera and mic
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          call.answer(stream);
          // save the close function
          // currentCall = call;
          // change to the video view
          let count = 0;
          call.on("stream", (remoteStream) => {
            count = count + 1;
            if(count == 2){
             return
            }
            else {
              remoteStreamNetwork = remoteStream;

              // when we receive the remote stream, play it
              // document.getElementById("remote-video").srcObject = remoteStream;
              // document.getElementById("remote-video").play();

              $("#video-" + call.peer).parents('.live').remove(); //Remove remote video if exists before
              $(".record-wrapper-" + call.peer).parents('.live').remove();      

              $("#video-list").append("<div class='live'>" +
                "<video id='video-" + call.peer + "' autoplay style='max-width: 400px;' class='remote-video'></video> " +
                  // "<div data-record='"+ call.peer + "'  class='rec'>" +
                  //    "<button class='btn'>record</button>" +
                  //     "<button class='stopbtn'>stop record</button>" + 
                  // "</div>" +
                "</div> "); //Create new video element

          
              $("#video-"+ call.peer).prop("srcObject", remoteStream); //Put stream to the video
              remoteStreamState = remoteStream;

              currentCall[call.peer] = call;


              var currentVideo =  document.getElementById('video-' + call.peer);
              videoRecOn(call.peer, currentVideo);
          
              var network = setInterval(function(){
             
                // if(remoteStream.getVideoTracks()[0].muted == true && document.querySelector("#video-"+ call.peer) != null){
                if(remoteStream.getVideoTracks()[0].muted == true){
                  console.log(remoteStream.getVideoTracks()[0].muted);
                  // document.querySelector("#video-"+ call.peer).closest('.live').remove();
                  clearInterval(network);
                  videoRecOff(call.peer);
                  //call.close();
                  return "";
                }
                else{
                 console.log(remoteStream.getVideoTracks()[0].muted);
                }

              }, 4000);
            }

          });

        })
        .catch((err) => {
          console.log("Failed to get local stream:", err);
        });
    
  });



 // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


  
  // record of video starts
  function videoRecOn(recID, currentVideo){
    console.log(recID);
    if (currentVideo.srcObject != null) {
        alert('Inside of videoRecOn');

        mediaArr[recID] =  new MediaRecorder(currentVideo.srcObject);
        mediaArr[recID].start(1000);
        var parts = [];

        mediaArr[recID].ondataavailable = function(e){      
          parts.push(e.data);
          console.log(parts);
        }
        mediaArr[recID]['blobParts'] = parts;

        console.log('mediaArr[recID].state');
        console.log(mediaArr[recID].state);
    }
    else{
      alert('no stream detected');
    }
  
  }
  // record of video stops
  let countRec = 0;
  function videoRecOff(recID){
    countRec = countRec + 1;
    if(countRec == 2){
     return
    }
    else {
      if (mediaArr[recID] != undefined) {

        mediaArr[recID].stop();
        mediaArr[recID].onstop = function(e) {
          console.log('mediaArr[recID].state in OFF');
          console.log(mediaArr[recID].state);

          if ( mediaArr[recID]['blobParts'] ) {
            var blob =  new Blob(mediaArr[recID]['blobParts'], {
              type: 'video/webm'
              // type: 'video\/mp4'
            });
            const url =  URL.createObjectURL(blob);
            const a =  document.createElement('a');
            document.body.appendChild(a);
            // a.style = 'display: none';
            a.href =  url;
            a.text = 'link';
            a.download = 'test.webm';
            // a.download = 'test.mp4';
            a.click();
            // delete  mediaArr[recID];
            currentCall[recID].close();
            if (document.getElementById("video-" + recID).closest('.live') != null) {
              document.getElementById("video-" + recID).closest('.live').remove();
            }
            //peer.destroy();
            alert('Disconnected');
          }

        }

      }   
    } 
  }
  

   


