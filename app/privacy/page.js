export default function Privacy() {
  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',padding:'24px 20px'}}>
      <div style={{maxWidth:600,margin:'0 auto',background:'white',borderRadius:16,padding:24}}>
        <h1 style={{fontSize:22,fontWeight:600,marginBottom:16}}>Privacy Policy</h1>
        <p style={{fontSize:13,color:'#999',marginBottom:20}}>Last updated: July 2026</p>

        <div style={{fontSize:14,color:'#333',lineHeight:1.7}}>
          <p style={{marginBottom:16}}>
            MessPass collects your name and mobile number when you register for meal services at a mess using this platform. This information is used solely to:
          </p>
          <ul style={{marginBottom:16,paddingLeft:20}}>
            <li>Identify you for meal tracking and subscription management</li>
            <li>Allow the mess owner to approve your registration</li>
            <li>Record your meal history for billing and renewal purposes</li>
          </ul>
          <p style={{marginBottom:16}}>
            Your data is shared only with the specific mess you register with. It is not sold, rented, or shared with any third party for marketing or any other purpose.
          </p>
          <p style={{marginBottom:16}}>
            Your data is stored securely and retained for as long as you remain a customer of the mess, or as required for record-keeping purposes.
          </p>
          <p style={{marginBottom:16}}>
            You may request the mess owner to delete your data at any time by contacting them directly.
          </p>
          <p style={{marginBottom:0}}>
            This policy is provided in accordance with the Digital Personal Data Protection Act, 2023 (India).
          </p>
        </div>

        <a href="/" style={{display:'inline-block',marginTop:24,color:'#0F6E56',fontSize:14,fontWeight:500}}>← Back</a>
      </div>
    </div>
  )
}
