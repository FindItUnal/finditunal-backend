import UserModel from './models/UserModel';
import ReportModel from './models/ReportModel';
import CategoryModel from './models/CategoryModel';
import LocationModel from './models/LocationModel';
import ObjectModel from './models/ObjectModel';
import ImageModel from './models/ImageModel';
import ComplaintModel from './models/ComplaintModel';

export interface Models {
  userModel: typeof UserModel;
  reportModel: typeof ReportModel;
  categoryModel: typeof CategoryModel;
  locationModel: typeof LocationModel;
  objectModel: typeof ObjectModel;
  imageModel: typeof ImageModel;
  complaintModel: typeof ComplaintModel;
}
