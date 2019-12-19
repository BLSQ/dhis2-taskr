import React, {Component} from 'react';
class ErrorBoundary extends Component {
   constructor(props) {
      super(props);
      this.state = { hasError: false };
   }

   static getDerivedStateFromError(error) {
      return { hasError: true };
   }

   componentDidCatch(error, info) {
      console.log(error, info);
      this.setState({error,info})
   }

   render() {
     if (this.state.hasError) {
       return <span>Something went wrong. {this.state.info}</span>;
     }

     return this.props.children;
   }
}
export default ErrorBoundary