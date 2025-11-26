import { createApp } from './index';
import UserModel from './models/UserModel';
import ReportModel from './models/ReportModel';
import CategoryModel from './models/CategoryModel';
import LocationModel from './models/LocationModel';
import ObjectModel from './models/ObjectModel';
import ImageModel from './models/ImageModel';
import ComplaintModel from './models/ComplaintModel';

createApp({
  models: {
    userModel: UserModel,
    reportModel: ReportModel,
    categoryModel: CategoryModel,
    locationModel: LocationModel,
    objectModel: ObjectModel,
    imageModel: ImageModel,
    complaintModel: ComplaintModel,
  },
});
