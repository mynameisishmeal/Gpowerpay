import mongoose, { Schema, Model } from 'mongoose';

export interface ISettings {
  _id: string;
  socials: {
    platform: string;
    url: string;
    icon?: string;
  }[];
  phoneNumbers: string[];
  emails: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  socials: [{
    platform: { type: String, required: true },
    url: { type: String, required: true },
    icon: { type: String },
  }],
  phoneNumbers: [{ type: String }],
  emails: [{ type: String }],
}, {
  timestamps: true,
  collection: 'settings'
});

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
