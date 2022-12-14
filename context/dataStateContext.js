import { useReducer, createContext } from "react";
import Cookies from 'js-cookie'

let reducer = (state, action) => {
  switch (action.type) {
    case "basket":
      Cookies.set('basket', JSON.stringify([ ...action.state ]))
      return { ...state, basket: action.state }
    case "user":
      Cookies.set('user', JSON.stringify({ ...action.state }))
      return { ...state, user: action.state }
    case "token":
      Cookies.set('token', action.state)
      return { ...state, user: action.state }
    case "cookies":
      Cookies.set('cookies_agree', action.state)
      return { ...state, cookies_agree: action.state }
    case "state":
      return { ...state, state: action.state } 
    case "filterCategory":
      return { ...state, filterCategory: action.state }
    case "filterParameters":
      return { ...state, filterParameters: action.state }
    default:
      console.error('action.type: "' + action.type + '" is not implemented')
      return state
  }
};

const initialState = {
  basket: Cookies.get('basket') ? JSON.parse(Cookies.get('basket')) : [],
  user: Cookies.get('user') ? JSON.parse(Cookies.get('user')) : [],
  token: Cookies.get('token') ? Cookies.get('token') : '',
  cookies_agree: Cookies.get('cookies_agree') ? Cookies.get('cookies_agree') : false,
  state: {
    searchFocus: false,
    sort: 'published_at:asc',
  },
  filterCategory: [],
  filterParameters: [],
}

const DataStateContext = createContext(initialState);

function DataProvider(props) {
  const [dataContextState, dataContextDispatch] = useReducer(reducer, initialState);
  return (
    <DataStateContext.Provider value={{ dataContextState, dataContextDispatch }}>
      {props.children}
    </DataStateContext.Provider>
  );
}

export { DataStateContext, DataProvider };
