import buildClient from '../api/build-client';

const LandingPage = ({ currentUser }) => {
    return currentUser 
            ?  <h1> You are signed in </h1> 
            : <h1> You are not sign in </h1>
}

// context se refiere a { req, res }. La ide es que se desetructuren en buildClient
LandingPage.getInitialProps = async( context ) => {
    const { data } = await buildClient(context).get('/api/users/currentuser');

    return data;
}

export default LandingPage;

