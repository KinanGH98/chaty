import useWebSocket from "react-use-websocket";
import {useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationCircle, faPaperPlane} from "@fortawesome/free-solid-svg-icons";
import '/src/chat-window.css';
import {motion, useAnimation} from 'framer-motion';
import {useLayoutEffect} from "react";

export default function ChatWindow()
{
    // const socketUrl = '//localhost:8080';
    const socketUrl = 'wss://chat-app-websocket-server.onrender.com/';
    const [inputMessage, setInputMessage] = useState('');
    const messagesPanel = useRef(null);
    const inputRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const notificationAudio = new Audio("/notification.ogg");
    const {sendMessage, lastMessage, readyState} = useWebSocket(socketUrl, {
        shouldReconnect: () => true, // Always attempt to reconnect on close
        reconnectAttempts: Number.MAX_VALUE, // Number of reconnection attempts
        reconnectInterval: 3000, // Reconnection interval in milliseconds
    });

    useEffect(() =>
    {
        // Scroll to the end of screen.
        if (messagesPanel.current) messagesPanel.current.scrollIntoView({behavior: 'smooth', block: 'end'});
    }, [messages]);

    const handleSendMessage = () =>
    {
        addNewMessage(inputMessage, true);
        sendMessage(inputMessage);
        setInputMessage('');
    };

    useEffect(() =>
    {
        if (!lastMessage) return;

        if (lastMessage.data instanceof Blob)
        {
            const reader = new FileReader();
            reader.onload = () => addNewMessage(reader.result, false);
            reader.readAsText(lastMessage.data);
        }
        else
            addNewMessage(lastMessage.data, false)

        notificationAudio.play();
    }, [lastMessage]);

    useLayoutEffect(() =>
    {
        const handleResize = () =>
        {
            if (messagesPanel.current)
            {
                // Scroll to the bottom to keep the latest messages in view
                messagesPanel.current.scrollIntoView({behavior: 'instant', block: 'end'});
            }
        };

        window.visualViewport.addEventListener('resize', handleResize);

        // Initial adjustment
        handleResize();

        return () =>
        {
            window.visualViewport.removeEventListener('resize', handleResize);
        };
    }, []);

    function addNewMessage(newMessage, isFromUser)
    {
        let newArr = messages.slice();
        newArr.push({text: newMessage, fromUser: isFromUser});
        setMessages(newArr);
    }

    return (
        <div className='chatWindow'>
            <div className="background"></div>
            {readyState !== 1 &&
                <div className='connectionStatusIconParent'>
                    <FontAwesomeIcon className='connectionStatusIcon'
                                     icon={faExclamationCircle}
                                     color='rgb(255,148,148)'
                                     size='xl'
                                     title={'Can\'t connect to server'}>
                    </FontAwesomeIcon>
                </div>
            }

            <div className="messagesPanel" ref={messagesPanel}>
                <Message text='Welcome to the chat!'></Message>
                {
                    messages.map((message, index) =>
                        <Message key={'message ' + index} text={message.text}
                                 fromUser={message.fromUser}></Message>)
                }
            </div>
            <MessageSender inputMessage={inputMessage} handleSendMessage={handleSendMessage}
                           setInputMessage={setInputMessage} readyState={readyState}
                           inputRef={inputRef}></MessageSender>
        </div>
    );
}

function Message({text, fromUser})
{
    return (
        <span className={fromUser ? 'userMessage' : 'message'}>{text}</span>
    );
}

function MessageSender({inputMessage, setInputMessage, handleSendMessage, readyState, inputRef})
{
    const [isOnMobile, setIsOnMobile] = useState(false);

    useEffect(() =>
    {
        setIsOnMobile(/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);

    useEffect(() =>
    {
        if (inputRef.current)
        {
            // Reset textarea height to 'auto' to shrink it when the text is deleted
            inputRef.current.style.height = 'auto';
            // Set the textarea height to scrollHeight to fit the content
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    }, [inputMessage]);

    const inputFieldAnimation = useAnimation();

    const handleKeyDown = (e) =>
    {
        // Allow Shift+Enter to add a new line.
        if (e.key === 'Enter' && (!isOnMobile && !e.shiftKey))
            sendMessage(e);
    };

    const handleChange = (e) =>
    {
        setInputMessage(e.target.value);
    };

    return (
        <div className="messageSender">
            <motion.div className="textareaContainer" onClick={focusOnTextArea}
                        animate={inputFieldAnimation}
                        initial={{scale: 1}}>
                <textarea
                    name='messageSenderField'
                    className='messageSenderField'
                    disabled={readyState !== 1}
                    value={inputMessage}
                    ref={inputRef}
                    placeholder={readyState === 1 ? "Type a message..." : 'Can\'t connect to server'}
                    autoComplete='off'
                    title={readyState !== 1 ? "Can\'t connect to server" : ""}
                    rows='1'
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
            </motion.div>
            <FontAwesomeIcon className='sendMessageButton'
                             icon={faPaperPlane}
                             size='lg'
                             title='Send message'
                             onClick={sendMessage}>
            </FontAwesomeIcon>
        </div>
    );

    function sendMessage(e)
    {
        inputRef.current.focus();
        e.preventDefault();
        e.stopPropagation();
        if (inputMessage === '') return;
        if (readyState !== 1) return;

        inputFieldAnimation.start({
            scale: [1, 1.05, 1],
            transition: {duration: 0.1}
        });

        handleSendMessage();
    }

    function focusOnTextArea()
    {
        inputRef.current.focus();
    }
}