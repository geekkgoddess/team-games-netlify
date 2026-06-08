#!/usr/bin/env python3
"""
Team Members CSV to JSON Converter
Converts team-members.csv to team-roster.json format
"""

import csv
import json
import sys
from datetime import datetime

def csv_to_team_roster_json(csv_file, json_file='team-roster.json'):
    """Convert CSV file to team-roster.json format"""

    team_members = []

    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            if not reader.fieldnames or 'Name' not in reader.fieldnames:
                print("❌ Error: CSV must have 'Name' column")
                print("Expected headers: Name, Avatar, Clue1, Clue2, Clue3, Clue4, Clue5")
                return False

            for idx, row in enumerate(reader, 1):
                name = row.get('Name', '').strip()
                avatar = row.get('Avatar', '').strip()

                if not name:
                    print(f"⚠️  Skipping row {idx}: Name is empty")
                    continue

                if not avatar:
                    print(f"⚠️  Skipping row {idx} ({name}): Avatar is empty")
                    continue

                # Collect clues (Clue1, Clue2, Clue3, etc.)
                clues = []
                for i in range(1, 10):  # Support up to 9 clues
                    clue_key = f'Clue{i}'
                    if clue_key in row:
                        clue = row[clue_key].strip()
                        if clue:
                            clues.append(clue)

                if not clues:
                    print(f"⚠️  Warning: {name} has no clues")

                member = {
                    "id": f"member-{idx:03d}",
                    "name": name,
                    "avatar": avatar,
                    "status": "active",
                    "guessTheCoworker": {
                        "clues": clues
                    }
                }
                team_members.append(member)

        if not team_members:
            print("❌ Error: No valid team members found in CSV")
            return False

        # Create the output structure
        output = {
            "teamMembers": team_members,
            "metadata": {
                "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
                "totalMembers": len(team_members),
                "instructions": "Edit in GitHub. When you commit and push, Netlify auto-deploys within 30 seconds."
            }
        }

        # Write JSON file
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print(f"✅ Successfully converted {len(team_members)} team members!")
        print(f"📄 Saved to: {json_file}")
        print(f"\nTeam Members:")
        for member in team_members:
            clue_count = len(member["guessTheCoworker"]["clues"])
            print(f"  - {member['name']} ({member['avatar']}) - {clue_count} clues")

        return True

    except FileNotFoundError:
        print(f"❌ Error: File not found: {csv_file}")
        print(f"   Make sure you have created a CSV file named '{csv_file}'")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    """Main entry point"""

    # Check command line arguments
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
        json_file = sys.argv[2] if len(sys.argv) > 2 else 'team-roster.json'
    else:
        csv_file = 'team-members.csv'
        json_file = 'team-roster.json'

    print(f"🔄 Converting {csv_file} → {json_file}")
    print()

    success = csv_to_team_roster_json(csv_file, json_file)

    if success:
        print("\n📋 Next steps:")
        print(f"  1. Review the {json_file} file")
        print(f"  2. Copy to src/data/team-roster.json")
        print("  3. Commit to GitHub: git add src/data/team-roster.json")
        print('  4. Push: git commit -m "bulk: add team members"')
        print("  5. Push: git push origin main")
        print("\n✅ Done! Changes will auto-deploy within 30 seconds.")
        sys.exit(0)
    else:
        print("\n❌ Conversion failed. Please check the errors above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
