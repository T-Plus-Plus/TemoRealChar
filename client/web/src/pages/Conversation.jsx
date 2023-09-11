/**
 * src/pages/Conversation.jsx
 *
 * created by Lynchee on 7/28/23
 */

import React, { useEffect, useRef, useState } from 'react';
import CallView from '../components/CallView';
import TextView from '../components/TextView';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';

// import Avatar from '@mui/material/Avatar';
import useAvatarView from '../components/AvatarView';
import { extractEmotionFromPrompt } from '@avatechai/avatars';
import lz from 'lz-string';

import matt_idle from '../assets/videos/matt_idle.mp4';
import { debounce } from 'lodash';

// TODO: user can access this page only if isConnected.current

const Conversation = ({
  isConnecting,
  isConnected,
  isRecording,
  isPlaying,
  isThinking,
  isResponding,
  audioPlayer,
  handleStopCall,
  handleContinueCall,
  audioQueue,
  audioContextRef,
  audioSourceNodeRef,
  setIsPlaying,
  handleDisconnect,
  isCallView,
  setIsCallView,
  send,
  stopAudioPlayback,
  textAreaValue,
  setTextAreaValue,
  messageInput,
  setMessageInput,
  setUseSearch,
  setUseEchoCancellation,
  callActive,
  startRecording,
  stopRecording,
  setPreferredLanguage,
  selectedCharacter,
  messageId,
  token,
  isTextStreaming,
  sessionId,
  setSelectedCharacter,
  setSelectedModel,
  setSelectedDevice,
  setUseMultiOn,
  connect,
}) => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const {
    character = '',
    selectedModel = '',
    selectedDevice = '',
    isCallViewParam = '',
    preferredLanguage = '',
    useSearchParam = '',
    useEchoCancellationParam = '',
    useMultiOnParam = '',
  } = queryString.parse(search);
  const isCallViewUrl = isCallViewParam === 'true';
  const useSearch = useSearchParam === 'true';
  const useEchoCancellation = useEchoCancellationParam === 'true';
  const useMultiOn = useMultiOnParam === 'true';
  const message = isTextStreaming ? '' : textAreaValue;
  const [emotion, setEmotion] = useState('');

  // #region Gooey declaration
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [matt_speaking, setMattSpeaking] = useState(null);
  const videoRef = useRef(null);
  const ideal_face =
    'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/ef9a2d1a-4f76-11ee-ab96-02420a0001a4/matt_idle.mp4';
  const ideal_face_1 =
    'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/0b36f2e0-4f79-11ee-b0d4-02420a0001a3/matt_idle_1.mp4';
  const speaking_face =
    'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/784d65a0-4f6d-11ee-8c8c-02420a0001a5/matt_speaking.mp4';
  const voiceOptions = 'Google UK English Male';
  const lipSync = async text => {
    const payload = {
      input_face: ideal_face,
      text_prompt: Array.isArray(text) ? text[0] : text,
      google_voice_name: 'en-GB-News-J',
      google_speaking_rate: 1.0,
    };

    try {
      const response = await fetch(
        'https://api.gooey.ai/v2/LipsyncTTS/?run_id=3pdoyhzh&uid=EzamiSECR5bJwT0vHV3Si6ljitF2',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + process.env.REACT_APP_GOOEY_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        console.log(response.status);
        throw new Error(response.status);
      }

      const data = await response.json();
      setMattSpeaking(data.output.output_video);
      setIsSpeaking(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const debouncedEffect = debounce(textAreaValue => {
    if (textAreaValue) {
      const splits = textAreaValue.split('> ');
      if (splits.length > 1) {
        const lastMessage = splits[splits.length - 1];
        if (!splits[splits.length - 2].endsWith('You')) {
          // TODO: Send POST request here
          console.log(lastMessage);
          lipSync(lastMessage);
        }
      }
    }
  }, 1000);

  useEffect(() => {
    debouncedEffect(textAreaValue);
    return () => debouncedEffect.cancel();
  }, [textAreaValue]);
  // #endregion

  useEffect(() => {
    const emotion = extractEmotionFromPrompt(message);
    if (emotion && emotion.length > 0) setEmotion(emotion);
  }, [message]);

  useEffect(() => {
    if (
      character === '' ||
      selectedModel === '' ||
      selectedDevice === '' ||
      isCallViewUrl === '' ||
      preferredLanguage === '' ||
      useSearch === '' ||
      useEchoCancellation === ''
    ) {
      navigate('/');
    }
    const paramSelectedCharacter = JSON.parse(
      lz.decompressFromEncodedURIComponent(character)
    );
    setSelectedCharacter(paramSelectedCharacter);

    setSelectedModel(selectedModel);

    setSelectedDevice(selectedDevice);

    setIsCallView(isCallViewUrl);

    setPreferredLanguage(preferredLanguage);

    setUseSearch(useSearch);

    setUseEchoCancellation(useEchoCancellation);

    setUseMultiOn(useMultiOn);
  }, []);

  useEffect(() => {
    if (!isConnecting.current) {
      const tryConnect = async () => {
        try {
          // requires login if user wants to use gpt4 or claude.
          connect();
        } catch (error) {
          console.error(error);
        }
      };
      tryConnect();
    }

    const handleUnload = event => {
      event.preventDefault();
      navigate('/');
    };
    window.addEventListener('beforeunload', handleUnload);

    // Clean up event listener on component unmount
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [connect]);

  if (!isConnected.current) {
    return null;
  }

  return (
    <main className='p-8 mx-auto max-w-7xl w-full' style={{ height: '100vh' }}>
      {/* we render both views but only display one. */}
      <p className='alert text-white'>
        {isConnected.current && isThinking && isCallView ? (
          <span>{selectedCharacter.name} is thinking...</span>
        ) : isConnected.current && isRecording ? (
          <span className='recording'>Recording</span>
        ) : null}
      </p>
      <div className='flex flex-col space-y-4 w-full justify-center items-center'>
        <video
          ref={videoRef}
          // eslint-disable-next-line react/no-unknown-property
          x-webkit-airplay='allow'
          autoPlay
          loop={!isSpeaking}
          muted={!isSpeaking}
          preload='auto'
          className='css-1drke4h e3rlp0e0'
          src={isSpeaking ? matt_speaking : matt_idle}
          onEnded={() => setIsSpeaking(false)}
        ></video>
        {/* {avatarDisplay} */}
      </div>

      <div
        className='main-screen'
        style={{ display: isCallView ? 'flex' : 'none' }}
      >
        <CallView
          isRecording={isRecording}
          isPlaying={isPlaying}
          isResponding={isResponding}
          audioPlayer={audioPlayer}
          handleStopCall={handleStopCall}
          handleContinueCall={handleContinueCall}
          audioQueue={audioQueue}
          audioContextRef={audioContextRef}
          audioSourceNodeRef={audioSourceNodeRef}
          setIsPlaying={setIsPlaying}
          handleDisconnect={handleDisconnect}
          setIsCallView={setIsCallView}
          sessionId={sessionId}
        />
      </div>

      <div style={{ width: '100%', display: isCallView ? 'none' : 'flex' }}>
        <TextView
          selectedCharacter={selectedCharacter}
          send={send}
          isPlaying={isPlaying}
          isThinking={isThinking}
          isResponding={isResponding}
          stopAudioPlayback={stopAudioPlayback}
          textAreaValue={textAreaValue}
          setTextAreaValue={setTextAreaValue}
          messageInput={messageInput}
          setMessageInput={setMessageInput}
          handleDisconnect={handleDisconnect}
          setIsCallView={setIsCallView}
          useSearch={useSearch}
          setUseSearch={setUseSearch}
          callActive={callActive}
          startRecording={startRecording}
          stopRecording={stopRecording}
          preferredLanguage={preferredLanguage}
          setPreferredLanguage={setPreferredLanguage}
          messageId={messageId}
          token={token}
          sessionId={sessionId}
        />
      </div>
    </main>
  );
};

export default Conversation;
