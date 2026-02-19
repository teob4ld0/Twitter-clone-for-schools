import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SafetyStandardsScreen({ navigation }) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textOnPrimary,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    lastUpdated: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    hr: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    subSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 12,
    },
    listItem: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 24,
      paddingLeft: 12,
      marginBottom: 4,
    },
    bold: {
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    footer: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
  });

  const B = ({ children }) => <Text style={styles.bold}>{children}</Text>;
  const P = ({ children }) => <Text style={styles.paragraph}>{children}</Text>;
  const Li = ({ children }) => <Text style={styles.listItem}>• {children}</Text>;
  const Hr = () => <View style={styles.hr} />;
  const H2 = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Child Safety Standards</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>
          <B>Last updated:</B> February 18, 2026
        </Text>

        <Hr />

        <H2>1. About Twittetec</H2>
        <P>
          Twittetec is a social network built exclusively for the school community of <B>ETec</B>. It is not a public platform — access is restricted to verified members of the school, and registration requires a valid school email address. This closed environment helps ensure that every user is a known member of the institution.
        </P>

        <Hr />

        <H2>2. Our Commitment Against CSAE</H2>
        <P>
          Twittetec has zero tolerance for child sexual abuse and exploitation (CSAE) content of any kind. Any content, behavior, or interaction that exploits, endangers, or sexualizes minors is strictly prohibited and will result in immediate action.
        </P>

        <Hr />

        <H2>3. Restricted Access</H2>
        <P>Unlike open social networks, Twittetec enforces strict access controls:</P>
        <Li><B>School email required:</B> Only users with a verified school email address from ETec can create an account. Public or personal email providers are not accepted.</Li>
        <Li><B>Email verification:</B> All accounts must verify their email address before being able to use the platform.</Li>
        <Li><B>Known community:</B> Because every user must belong to the school, there is a direct link between accounts and real individuals within the institution.</Li>

        <Hr />

        <H2>4. Moderation by School Staff</H2>
        <P>The platform is actively moderated by <B>teachers and school staff</B>, who have administrator privileges. Admins can:</P>
        <Li><B>Review reported content</B> and take appropriate action</Li>
        <Li><B>Ban users</B> who violate the platform's rules or engage in harmful behavior</Li>
        <Li><B>Delete accounts</B> entirely when necessary</Li>
        <Li><B>Remove content</B> that is inappropriate, harmful, or violates safety standards</Li>
        <P>
          Because moderators are teachers who know the student body personally, they are well-positioned to identify and respond to concerning behavior quickly.
        </P>

        <Hr />

        <H2>5. Reporting Mechanisms</H2>
        <P>Users can report safety concerns through the following channels:</P>
        <Li><B>In-app reporting:</B> Users can flag content or accounts directly within the application</Li>
        <Li><B>Direct contact with moderators:</B> Since moderators are teachers at the school, students can also report concerns in person</Li>
        <Li><B>Email:</B> Reports can be sent to xb912f0uhbrz@brevo-mail.com</Li>
        <P>
          All reports are reviewed promptly. When content involves potential CSAE, it is escalated and reported to the relevant regional and national authorities as required by law.
        </P>

        <Hr />

        <H2>6. Prevention Measures</H2>
        <Li><B>Closed registration:</B> No outside users can join the platform</Li>
        <Li><B>Active moderation:</B> Teachers monitor activity and can act immediately</Li>
        <Li><B>Account banning:</B> Users who violate rules are banned and their accounts can be permanently deleted</Li>
        <Li><B>Content visibility:</B> Public posts are visible to all users in the school community, making harmful behavior easier to detect</Li>
        <Li><B>Direct messages:</B> Chat functionality is limited to registered school members only</Li>

        <Hr />

        <H2>7. Legal Compliance</H2>
        <P>Twittetec complies with all applicable child safety laws. In cases where CSAE content is identified, we will:</P>
        <Li>Immediately remove the content and ban the responsible account</Li>
        <Li>Preserve relevant evidence as required by law</Li>
        <Li>Report the incident to the appropriate regional and national authorities</Li>
        <Li>Cooperate fully with law enforcement investigations</Li>

        <Hr />

        <H2>8. Contact</H2>
        <P>If you have questions about our child safety practices or need to report a concern:</P>
        <Li><B>Email:</B> xb912f0uhbrz@brevo-mail.com</Li>
        <Li><B>Website:</B> https://app.twittetec.com</Li>

        <Hr />

        <Text style={styles.footer}>© 2026 Twittetec. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}
