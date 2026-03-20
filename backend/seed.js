const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const db = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_portal_pro';
// Connect to DB

const seedData = async () => {
    try {

        await mongoose.connect(db);
        console.log("✅ MongoDB Connected for Seeding");
        // 1. Clear old data
        await Category.deleteMany({});
        console.log("Cleared old categories.");

        // 2. Create the 8 Root Categories
        const roots = await Category.insertMany([
            { title: 'Electric Wire Rope Hoist', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Optimized-Electric-Wire-Rope-Hoist-1024x683-1.jpg',parent:null },
            { title: 'Electric Chain Hoist', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Electric-Chain-Hoist-3.jpg',parent:null },
            { title: 'Overhead EOT Cranes', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Double-Girder-Crane.jpg',parent:null },
            { title: 'Goliath Cranes', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Gantry-Goliath-Crane.jpg' ,parent:null},
            // { title: 'Blocks', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Manual-Chain-Pulley-Block-Heavy-Duty.jpg',parent:null },
            { title: 'Trolley', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Optimized-Cross-Travelling-Trolley.jpg' ,parent:null},
            { title: 'Manual Chain Pulley Block', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Manual-Trolley-1.jpg' ,parent:null},
            { title: 'JIB Crane', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Pillar-Mounted-Jib-Crane-Chain-Hoist.jpeg' ,parent:null},
            { title: 'Spares', image: 'https://drive.google.com/file/d/19mU_TqW2bYQt66YmoDy-grK30u_6qrzU/view?usp=sharing' ,parent:null},
            { title: 'UnderSlung Cranes', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2017/01/Single-Girder-Under-Slung-Crane-2.jpg',parent:null },
            { title: 'Winch', image: '',parent:null }
        ]);
        console.log("🌱 Created 8 Root Categories");

        // 3. Create Nesting Example for "Electric Wire Hoist" (roots[0])
        // const block = roots[4]._id;
        const block0 = roots[0]._id;
        const block11 = roots[1]._id;
        const block12 = roots[2]._id;
        const block3 = roots[3]._id;
        const block5 = roots[4]._id;
        const block6 = roots[5]._id;
        const block7 = roots[6]._id;
        const block8 = roots[7]._id;
        const block9 = roots[8]._id;
        const block10 = roots[9]._id;
        
    // Electric Wire Rope Hoist    
        
        const level0 = await Category.insertMany([
            {title : 'STD Series',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Electric-Wire-Rope-Hoists-1.jpg', 
            parent : block0, 
            isProduct : true , 
            productCode : 'STD',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Foot Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                            
                        ]
            },

            {title : 'SH Series',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/HD-Wire-Hoist-LOADMATE.jpg', 
            parent : block0, 
            isProduct : true , 
            productCode : 'SHS',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
           
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Foot Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                            
                        ]
            },
            {title : 'ECO Series',
            image : 'https://5.imimg.com/data5/SELLER/Default/2023/6/315916534/PF/ZC/GD/97963010/cd-type-chain-electric-hoist-1000x1000.jpg', 
            parent : block0, 
            isProduct : true , 
            productCode : 'ECO',
            basePrice : 100 ,
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Foot Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                            
                        ]
            },

            {title : 'MOD Series',
            image : '', 
            parent : block0, 
            isProduct : true , 
            productCode : 'MOD',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Foot Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                            
                        ]
            },
            {title : 'LH Series',
            image : '', 
            parent : block0, 
            isProduct : true , 
            productCode : 'LHS',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Foot Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                            
                        ]
            },
            {title : 'STD FLP Series',
            image : '', 
            parent : block0, 
            isProduct : true , 
            productCode : 'FLPEWRH',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Foot Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                            
                        ]
            }
            
        ]);

    // Electric Chain Hoist
        
        const level11 = await Category.insertMany([
            {title : 'SE Series',
            image : '', 
            parent : block11, 
            isProduct : true , 
            productCode : 'SE',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                        ]
            },

            {title : 'SE DS Series',
            image : '', 
            parent : block11, 
            isProduct : true , 
            productCode : 'SEDS',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                            {
                                label : 'Duty',
                                type : 'number'
                            }
                        ]
            },

            {title : 'EURO Series',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/Electric-Chain-Hoist.jpg', 
            parent : block11, 
            isProduct : true , 
            productCode : 'EURO',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },

                        ]
            },

            {title : 'ULHH Series',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/12/Optimized-lowheadroom1.jpg', 
            parent : block11, 
            isProduct : true , 
            productCode : 'ULHH',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                        ]
            },

            {title : 'FLP Series',
            image : '', 
            parent : block11, 
            isProduct : true , 
            productCode : 'FLPECH',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Manual Trolley Mounted","Electric Trolley Mounted"]
                            },

                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            }

                            
                        ]
            },

        ]);
        
    // Overhead EOT Cranes
        
        const level12 = await Category.insertMany([
            {title : 'SG EOT Crane',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/11/EOT-Cranes.jpg', 
            parent : block12, 
            isProduct : true , 
            productCode : 'SGEOT',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                            
                            
                        ]
            },

            {title : 'DG EOT Crane',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/Double-Girder-EOT-Crane-2.jpg', 
            parent : block12, 
            isProduct : true , 
            productCode : 'DGEOT',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                            
                        ]
            },
        ]);

    // Under Slung Crane
        const level99 = await Category.insertMany([
            {title : 'SG UnderSlung Crane',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2017/01/Single-Girder-Under-Slung-Crane-2.jpg', 
            parent : block9, 
            isProduct : true , 
            productCode : 'SGUS',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                            
                            
                        ]
            },

            {title : 'DG UnderSlung Crane',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2017/01/Underslung-Crane-Double-Girder-2.jpg', 
            parent : block9, 
            isProduct : true , 
            productCode : 'DGUS',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                            
                        ]
            }

            

        ]);    
    
    // Goliath Cranes
        
        const level33 = await Category.insertMany([
            {title : 'SG Goliath Crane',
            image : '', 
            parent : block3, 
            isProduct : true , 
            productCode : 'SGGC',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                            
                        ]
            },

            {title : 'DG Goliath Crane',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/goliathcrane2.jpg', 
            parent : block3, 
            isProduct : true , 
            productCode : 'DGGC',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                           
                        ]
            },

            {title : 'SG Semi Goliath Crane',
            image : 'https://loadmate.in/wp-content/uploads/2016/12/Semi-Goliath4.jpg', 
            parent : block3, 
            isProduct : true , 
            productCode : 'SGSG',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                           
                        ]
            },
            {title : 'DG Semi Goliath Crane',
            image : 'https://loadmate.in/wp-content/uploads/2016/12/Semi-Goliath1.jpg', 
            parent : block3, 
            isProduct : true , 
            productCode : 'DGSG',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                          
                        ]
            },

            {title : 'Portable Manual Crane',
            image : '', 
            parent : block3, 
            isProduct : true , 
            productCode : 'PTMC',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
    
                        ]
            },

            {title : 'RTG Crane',
            image : '', 
            parent : block3, 
            isProduct : true , 
            productCode : 'RTGC',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Span',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                                
                            },
                    
                        ]
            }
        ]);
        
    // Trolley
        
        const level5 = await Category.insertMany([
            {title : 'Manual Push Pull Trolley',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/Manual-Trolley-2.jpg', 
            parent : block5, 
            isProduct : true , 
            productCode : 'PPT',
            basePrice : 100 ,
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
             
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            
                           
                        ]
            },
            
            {title : 'Manual Geared Trolley',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/Manual-Trolley-1.jpg', 
            parent : block5, 
            isProduct : true , 
            productCode : 'GTT',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            
             
                        ]
            },

            {title : 'Electric Trolley',
            image : 'https://loadmate.in/wp-content/uploads/2016/06/Electric-Trolley-2.jpg', 
            parent : block5, 
            isProduct : true , 
            productCode : 'ETT',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            
                        
                        ]
            },
        ]);    
    
    // JIB Crane
        
        const level7 = await Category.insertMany([
            {title : 'Pillar Mounted JIB Crane',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/12/Pillar-Mounted-Jib-Crane-2.jpeg', 
            parent : block7, 
            isProduct : true , 
            productCode : 'PJC',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Arm Length',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                            },
                            
             
                        ]
            },

            {title : 'Wall Mounted JIB Crane',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/12/LOADMATE-Wall-Mounted-JIB-Crane-1.jpg', 
            parent : block7, 
            isProduct : true , 
            productCode : 'WJC',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Arm Length',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                            },
                            
                           
                        ]
            },
            {title : 'Wall Travelling Crane',
            image : '', 
            parent : block7, 
            isProduct : true , 
            productCode : 'WTC',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            {
                                label : 'Arm Length',
                                type : 'number'
                            },
                            {
                                label : 'HOL',
                                type : 'number'
                            },
                            
                           
                        ]
            }

        ]);     

        // Manual Chain Pulley Block
        
        const level6 = await Category.insertMany([
            {title : 'Portable Series',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/Manual-Chain-Pulley-Blocks-6-2.jpg', 
            parent : block6, 
            isProduct : true , 
            productCode : 'CPBP',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            
                            {
                                label : 'HOL',
                                type : 'number'
                            } ,
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Push Pull Trolley Mounted","Gear Trolley Mounted"]
                            }
                        ]
            },
            
            {title : 'HD Series',
            image : 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/11/Manual-Chain-Pulley-Block-Heavy-Duty.jpg', 
            parent : block6, 
            isProduct : true , 
            productCode : 'CPBHD',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            
                            {
                                label : 'HOL',
                                type : 'number'
                            },
                            
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Push Pull Trolley Mounted","Gear Trolley Mounted"]
                            }
                        ]
            },

            {title : '360 Degree Series',
            image : '', 
            parent : block6, 
            isProduct : true , 
            productCode : 'CPB360',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            
                            {
                                label : 'HOL',
                                type : 'number'
                            },
                            
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Push Pull Trolley Mounted","GearTrolley Mounted"]
                            }
                        ]
            },

            {title : 'SS Series',
            image : '', 
            parent : block6, 
            isProduct : true , 
            productCode : 'CPBSS',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            
                            {
                                label : 'HOL',
                                type : 'number'
                            },
                            
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Push Pull Trolley Mounted","GearTrolley Mounted"]
                            }
                        ]
            },

            {title : 'FLP Series',
            image : '', 
            parent : block6, 
            isProduct : true , 
            productCode : 'FLPCPB',
            basePrice : 100 , 
            brochurePdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            standardDrawingPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            technicalDetailsPdf: 'https://localhost:5000/uploads/1767435842891-SGSTR.pdf',
            
            formFields : [
                            {
                                label : 'Capacity',
                                type : 'number'
                            },
                            
                            {
                                label : 'HOL',
                                type : 'number'
                            },
                            {
                                label : 'Mounting',
                                type : 'select',
                                options : ["Hook Mounted","Push Pull Trolley Mounted","GearTrolley Mounted"]
                            }
                        ]
            },
        ]);    
    const level8 = await Category.insertMany([
            
            {title: 'Manual Chain Pulley Block / Trolley Spares', image: '' ,parent: block8, isProduct: false },
            {title: 'Electric Chain Hoist Spares ', image: '' ,parent: block8 , isProduct: false },
            {title: 'EOT Crane Spares', image: '' ,parent: block8, isProduct: false },
            {title: 'Electric Wire Rope Hoist Spares ', image: '' ,parent: block8 , isProduct: false },
            {title: 'Goliath Crane Spares', image: '' ,parent: block8, isProduct: false },
            {title: 'JIB Crane Spares', image: '' ,parent: block8 , isProduct: false },
            ]);
        
        /*onst level2 = await Category.insertMany([
            
            {title: 'Portable Series Chain Block', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2021/04/Manual-Chain-Pulley-Blocks-2.jpg' ,parent: block , isProduct: false },
            {title: 'HD Series Chain Block', image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/11/Manual-Chain-Pulley-Block-Heavy-Duty.jpg' ,parent: block , isProduct: false },
            ]);

        console.log("🌿 Created Level 2 Categories");

        const block1 = level2[0]._id;
        const block2 = level2[1]._id;
            
        const level3 = await Category.insertMany([
            
            {title: 'Push Pull Trolley', 
            image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/Manual-Chain-Pulley-Blocks-5.jpg' ,
            parent: block1 , 
            isProduct: true,
            productCode : 'PPT',
            basePrice : 100 ,
            formFields: [
                            {
                                label: 'Capacity',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,            
                            {
                                label: 'Mounting',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,   
                            {
                                label: 'Lifting Height',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,   
                            {
                                label: 'Span',        // e.g. "Lifting Height"
                                type: 'number'
                            }     
                        ]

            },
            
            
            {title: 'Geared Trolley',
            image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/Manual-Chain-Pulley-Blocks-3-1.jpg' ,
            parent: block1 , 
            isProduct: true ,
            productCode : 'GRT',
            basePrice : 100 ,
            formFields: [
                            {
                                label: 'Capacity',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,            
                            {
                                label: 'Mounting',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,   
                            {
                                label: 'Lifting Height',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,   
                            {
                                label: 'Span',        // e.g. "Lifting Height"
                                type: 'number'
                            }     
                        ]
            },
            {title: 'Hook Mounted Trolley',
            image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/06/CHAIN-PULLEY-BLOCK-20T.1.jpg' ,
            parent: block1 , 
            isProduct: true ,
            productCode : 'HMT',
            basePrice : 100 ,
            formFields: [
                            {
                                label: 'Capacity',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,           
                            {
                                label: 'Mounting',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,    
                            {
                                label: 'Lifting Height',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,    
                            {
                                label: 'Span',        // e.g. "Lifting Height"
                                type: 'number'
                            }     
                        ]
            },
            
            {title: 'HD Series', 
            image: 'https://cdn-cjmdb.nitrocdn.com/ltwKPloGeNbkCewIHBJDQgrxDWYtNJxW/assets/images/optimized/rev-e1594e3/loadmate.in/wp-content/uploads/2016/11/Manual-Chain-Pulley-Block-Heavy-Duty.jpg' ,
            parent: block2 , 
            isProduct: true ,
            productCode : 'HDS',
            basePrice : 100 ,
            formFields: [
                            {
                                label: 'Capacity',        // e.g. "Lifting Height"
                                type: 'number'
                            } ,            
                            {
                                label: 'Mounting',        // e.g. "Lifting Height"
                                type: 'number'
                            },     
                            {
                                label: 'Lifting Height',        // e.g. "Lifting Height"
                                type: 'number'
                            },    
                            {
                                label: 'Span',        // e.g. "Lifting Height"
                                type: 'number'
                            }     
                        ]

            },
    
        
        ]);*/

        console.log("✅ DONE! Created Nesting Structure.");
        console.log("Database Seeded!");
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();