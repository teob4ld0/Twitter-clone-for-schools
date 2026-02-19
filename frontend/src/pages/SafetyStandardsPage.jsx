import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

function SafetyStandardsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;

  const handleBack = () => {
    if (from) {
      navigate(from);
    } else {
      navigate(-1);
    }
  };

  const sectionStyle = {
    marginBottom: '24px',
  };

  const h2Style = {
    margin: '0 0 12px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: theme.colors.textPrimary,
  };

  const h3Style = {
    margin: '16px 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: theme.colors.textPrimary,
  };

  const pStyle = {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: theme.colors.textSecondary,
    lineHeight: '1.6',
  };

  const ulStyle = {
    margin: '0 0 12px 0',
    paddingLeft: '20px',
    fontSize: '14px',
    color: theme.colors.textSecondary,
    lineHeight: '1.8',
  };

  const hrStyle = {
    border: 'none',
    borderTop: `1px solid ${theme.colors.border}`,
    margin: '24px 0',
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: theme.colors.background,
      minHeight: '100vh',
    }}>
      <button
        onClick={handleBack}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.primary,
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '16px',
          padding: '8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ← Volver
      </button>

      <div style={{
        backgroundColor: theme.colors.cardBackground,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: theme.colors.shadowMd,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: theme.colors.textPrimary,
        }}>
          Child Safety Standards
        </h1>
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '13px',
          color: theme.colors.textSecondary,
        }}>
          <strong>Last updated:</strong> February 18, 2026
        </p>

        <hr style={hrStyle} />

        {/* 1. About Twittetec */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. About Twittetec</h2>
          <p style={pStyle}>
            Twittetec is a social network built exclusively for the school community of <strong>ETec</strong>. It is not a public platform — access is restricted to verified members of the school, and registration requires a valid school email address. This closed environment helps ensure that every user is a known member of the institution.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 2. Our Commitment */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Our Commitment Against CSAE</h2>
          <p style={pStyle}>
            Twittetec has zero tolerance for child sexual abuse and exploitation (CSAE) content of any kind. Any content, behavior, or interaction that exploits, endangers, or sexualizes minors is strictly prohibited and will result in immediate action.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 3. Access Control */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Restricted Access</h2>
          <p style={pStyle}>
            Unlike open social networks, Twittetec enforces strict access controls:
          </p>
          <ul style={ulStyle}>
            <li><strong>School email required:</strong> Only users with a verified school email address from ETec can create an account. Public or personal email providers are not accepted.</li>
            <li><strong>Email verification:</strong> All accounts must verify their email address before being able to use the platform.</li>
            <li><strong>Known community:</strong> Because every user must belong to the school, there is a direct link between accounts and real individuals within the institution.</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 4. Moderation */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Moderation by School Staff</h2>
          <p style={pStyle}>
            The platform is actively moderated by <strong>teachers and school staff</strong>, who have administrator privileges. Admins can:
          </p>
          <ul style={ulStyle}>
            <li><strong>Review reported content</strong> and take appropriate action</li>
            <li><strong>Ban users</strong> who violate the platform's rules or engage in harmful behavior</li>
            <li><strong>Delete accounts</strong> entirely when necessary</li>
            <li><strong>Remove content</strong> that is inappropriate, harmful, or violates safety standards</li>
          </ul>
          <p style={pStyle}>
            Because moderators are teachers who know the student body personally, they are well-positioned to identify and respond to concerning behavior quickly.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 5. Reporting */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Reporting Mechanisms</h2>
          <p style={pStyle}>
            Users can report safety concerns through the following channels:
          </p>
          <ul style={ulStyle}>
            <li><strong>In-app reporting:</strong> Users can flag content or accounts directly within the application</li>
            <li><strong>Direct contact with moderators:</strong> Since moderators are teachers at the school, students can also report concerns in person</li>
            <li><strong>Email:</strong> Reports can be sent to <strong>xb912f0uhbrz@brevo-mail.com</strong></li>
          </ul>
          <p style={pStyle}>
            All reports are reviewed promptly. When content involves potential CSAE, it is escalated and reported to the relevant regional and national authorities as required by law.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 6. Prevention Measures */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Prevention Measures</h2>
          <ul style={ulStyle}>
            <li><strong>Closed registration:</strong> No outside users can join the platform</li>
            <li><strong>Active moderation:</strong> Teachers monitor activity and can act immediately</li>
            <li><strong>Account banning:</strong> Users who violate rules are banned and their accounts can be permanently deleted</li>
            <li><strong>Content visibility:</strong> Public posts are visible to all users in the school community, making harmful behavior easier to detect</li>
            <li><strong>Direct messages:</strong> Chat functionality is limited to registered school members only</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 7. Compliance */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Legal Compliance</h2>
          <p style={pStyle}>
            Twittetec complies with all applicable child safety laws. In cases where CSAE content is identified, we will:
          </p>
          <ul style={ulStyle}>
            <li>Immediately remove the content and ban the responsible account</li>
            <li>Preserve relevant evidence as required by law</li>
            <li>Report the incident to the appropriate regional and national authorities</li>
            <li>Cooperate fully with law enforcement investigations</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 8. Contact */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Contact</h2>
          <p style={pStyle}>
            If you have questions about our child safety practices or need to report a concern:
          </p>
          <ul style={ulStyle}>
            <li><strong>Email:</strong> xb912f0uhbrz@brevo-mail.com</li>
            <li><strong>Website:</strong> https://app.twittetec.com</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        <p style={{
          fontSize: '13px',
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: '12px',
        }}>
          © 2026 Twittetec. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default SafetyStandardsPage;
