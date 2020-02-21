/* eslint-disable no-undef */ /* eslint-disable no-shadow */ /* eslint-disable react/prefer-stateless-function */ /* eslint-disable default-case */ /* eslint-disable consistent-return */ /* eslint-disable no-return-assign */ /* eslint-disable no-unused-vars */ /* eslint-disable react/jsx-no-undef */ // eslint-disable-line max-len
import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import "./style.css";
import 'semantic-ui-css/semantic.min.css';
import { createStore, combineReducers } from "redux";
import {connect, Provider} from "react-redux";
import uuid from "uuid";
import moment from "moment";
import USERS from "./users.json";

const reducer = combineReducers({
  activeThreadId: activeThreadIdReducer,
  threads: threadsReducer,
});

function activeThreadIdReducer(state = USERS[0].id, action) {
  if (action.type === 'OPEN_THREAD') {
    return action.id;
  } else {
    return state;
  }
}

function findThreadIndex(threads, action) {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      return threads.findIndex(
        (t) => t.id === action.threadId
      );
    }
    case 'DELETE_MESSAGE': {
      return threads.findIndex(
        (t) => t.messages.find((m) => (
          m.id === action.id
        ))
      );
    }
  }
}

function threadsReducer(state = USERS.map(o=>{return {...o,messages:messagesReducer(undefined,{})}}), action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
    case 'DELETE_MESSAGE': {
      const threadIndex = findThreadIndex(state, action);

      const oldThread = state[threadIndex];
      const newThread = {
        ...oldThread,
        messages: messagesReducer(oldThread.messages, action),
      };

      return [
        ...state.slice(0, threadIndex),
        newThread,
        ...state.slice(
          threadIndex + 1, state.length
        ),
      ];
    }
    default: {
      return state;
    }
  }
}

function messagesReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const newMessage = {
        text: action.text,
        sender: action.sender,
        timestamp: Date.now(),
        id: uuid.v4(),
      };
      return state.concat(newMessage);
    }
    case 'DELETE_MESSAGE': {
      const messageIndex = state.findIndex((m) => m.id === action.id);
      return [
        ...state.slice(0, messageIndex),
        ...state.slice(
          messageIndex + 1, state.length
        ),
      ];
    }
    default: {
      return state;
    }
  }
}

export const store = createStore(reducer);

function deleteMessage(id) {
  return {
    type: 'DELETE_MESSAGE',
    id: id,
  };
}

function addMessage(text, sender, receiver) {
  return {
    type: 'ADD_MESSAGE',
    text,
    sender,
    threadId: receiver,
  };
}

function openThread(id) {
  return {
    type: 'OPEN_THREAD',
    id: id,
  };
}

const App = () => (
  <div className='ui segment'>
    <ThreadTabs />
    <ThreadDisplay />
  </div>
);

const Tabs = (props) => (
  <div className='ui top attached tabular menu'>
    {
      props.tabs.map((tab, index) => (
        <div
          key={index}
          className={tab.active ? 'active item' : 'item'}
          onClick={() => props.onClick(tab.id)}
        >
          {tab.title}
        </div>
      ))
    }
  </div>
);

const mapStateToTabsProps = (state) => {
  const tabs = state.threads.map(t => (
    {
      title: t.title,
      active: t.id === state.activeThreadId,
      id: t.id,
    }
  ));

  return {
    tabs,
  };
};

const mapDispatchToTabsProps = (dispatch) => (
  {
    onClick: (id) => (
      dispatch(openThread(id))
    ),
  }
);

const ThreadTabs = connect(
  mapStateToTabsProps,
  mapDispatchToTabsProps
)(Tabs);

const TextFieldSubmit = (props) => {
  let input;

  return (
    <div className='ui input'>
      <input
        ref={node => input = node}
        type='text'
      >
      </input>
      <button
        onClick={() => {
          props.onSubmit(input.value);
          input.value = '';
        }}
        className='ui primary button'
        type='submit'
      >
        Submit
      </button>
    </div>
  );
};

const MessageList = (props) => (
  <div className='ui comments' style={{textAlign:"left"}}>
    {
      props.messages.map((m, index) => {
        const sender = USERS.find(({id})=>id===m.sender);
        return (
          <div
            className='comment'
            key={index}
            onClick={() => props.onClick(m.id)}
          >
            <a className="avatar"><img src={sender.avatar}/></a>
            <div className="content">
              <a className="author">{sender.title}</a>
              <div className="metadata"><span className="date">{moment(m.timestamp).format('MMMM Do YYYY, h:mm:ss a')}</span></div>
              <div className="text"><p>{m.text}</p></div>
            </div>
          </div>
        );
      })

    }
  </div>
);

const ReceiverList = ({selectedItem, items, onSelect}) => (
  <select value={selectedItem} onChange={onSelect}>
    {items.map(({val,key}) => (<option value={key} key={key}>{val}</option>))}
  </select>
);

class Thread extends Component {
  state = {receiver:USERS[0].id};
  render() {
    return (
      <div className='ui center aligned basic segment'>
        <MessageList
          messages={this.props.thread.messages}
          onClick={this.props.onMessageClick}
        />
        <TextFieldSubmit
          onSubmit={(t)=>this.props.onMessageSubmit(t,this.state.receiver)}
        />
        <ReceiverList
          selectedItem={this.state.receiver}
          items={USERS.map(({id,title})=>({key:id,val:title}))}
          onSelect={(e)=>this.setState({receiver:e.target.value})}
        />
      </div>
    );
  }
}

const mapStateToThreadProps = (state) => (
  {
    thread: state.threads.find(
      t => t.id === state.activeThreadId
    ),
  }
);

const mapDispatchToThreadProps = (dispatch) => (
  {
    onMessageClick: (id) => (
      dispatch(deleteMessage(id))
    ),
    dispatch: dispatch,
  }
);

const mergeThreadProps = (stateProps, dispatchProps) => (
  {
    ...stateProps,
    ...dispatchProps,
    onMessageSubmit: (text,receiver) => (
      dispatchProps.dispatch(
        addMessage(text ,stateProps.thread.id, receiver)
      )
    ),
  }
);

const ThreadDisplay = connect(
  mapStateToThreadProps,
  mapDispatchToThreadProps,
  mergeThreadProps
)(Thread);

export default App;
